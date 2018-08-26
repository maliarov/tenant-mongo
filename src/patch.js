const assert = require('assert');
const Server = require('mongodb-core/lib/topologies/server.js').prototype;
const Collection = require('mongodb/lib/collection.js').prototype;
const Db = require('mongodb/lib/db.js').prototype;

const {
    cursor,
    command,
    insert,
    remove,
    update,
} = Server;

Server.command = function (ns, cmd, options, callback) {
    const { tenant } = options;
    if (tenant) {
        cmd.query = cmd.query || {};

        injectTenant(tenant, cmd.query);
        injectSoftDeleteCheck(cmd.query);

        if (cmd.update) {
            removeTenant(cmd.update.$set);
            removeTenant(cmd.update.$unset);

            cmd.update.$set = cmd.update.$set || {};
            cmd.update.$set.lastModifiedDate = new Date();

            if (cmd.update.$unset) {
                delete cmd.update.$unset.createdDate;
                delete cmd.update.$unset.lastModifiedDate;
                delete cmd.update.$unset._deleted;
            }
        }
    }

    //console.log('----------------command', tenant, cmd);
    return command.call(this, ns, cmd, options, callback);
};

Server.cursor = function (ns, cmd, options) {
    const { tenant } = options;
    if (tenant) {
        if (cmd.query) {
            injectTenant(tenant, cmd.query);
            injectSoftDeleteCheck(cmd.query);
        } else if (cmd.pipeline) {
            cmd.pipeline = Array.isArray(cmd.pipeline) ? cmd.pipeline : [cmd.pipeline];
            
            injectTenantInPipeline(tenant, cmd.pipeline);
            injectSoftDeleteCheck(cmd.pipeline[0].$match);
        }
    }

    //console.log('cursor', JSON.stringify(cmd));

    if (options.includeTenant) {
        return cursor.call(this, ns, cmd, options);
    }

    return cursor
        .call(this, ns, cmd, options)
        .map(removeTenant);
};

Object
    .entries({ insert, remove, update })
    .forEach(([name, method]) => {
        Server[name] = function (ns, ops, options, callback) {
            const { tenant } = options;
            if (tenant) {
                switch (true) {
                    case method === update:
                        (ops || []).forEach((op) => {
                            op.q = op.q || {};
                            
                            injectTenant(tenant, op.q);
                            injectSoftDeleteCheck(op.q);

                            op.u = op.u || {};

                            removeTenant(op.u.$set);
                            removeTenant(op.u.$unset);

                            op.u.$set = op.u.$set || {};
                            op.u.$set.lastModifiedDate = new Date();
                            if (options.forceSoftDelete) {
                                op.u.$set._deleted = new Date();
                            }

                            if (op.u.$unset) {
                                delete op.u.$unset.createdDate;
                                delete op.u.$unset.lastModifiedDate;
                                delete op.u.$unset._deleted;
                            }
                        });
                        break;

                    case method === insert:
                        (ops || []).forEach((op) => {
                            injectTenant(tenant, op);
                            op.createdDate = new Date();
                            op.lastModifiedDate = new Date();
                        });
                        break;

                    case method === remove:
                        if (!options.deletionMode /* soft */) {
                            return Server.update.call(
                                this,
                                ns,
                                [{ ...ops, multi: !options.single }],
                                { ...options, forceSoftDelete: true },
                                callback
                            );
                        }

                        (ops || []).forEach((op) => {
                            op.q = op.q || {};
                            injectTenant(tenant, op.q);
                            injectSoftDeleteCheck(op.q);
                        });
                        break;
                }

                if (typeof callback === 'function') {
                    const cb = callback;

                    callback = function (err, res) {
                        switch (true) {
                            case method === update:
                                (ops || []).forEach((op) => {
                                    removeTenant(op.q);
                                });
                                break;

                            case method === insert || method === remove:
                                (ops || []).forEach((op) => {
                                    removeTenant(op);
                                });
                                break;
                        }

                        return cb.call(this, err, res);
                    };
                }
            }

            //console.log(`----------------${name}`, options, JSON.stringify(ops));
            return method.call(this, ns, ops, options, callback);
        };
    });


Db.setTenant = function ({ tenant, collections }) {
    assert(tenant, 'no tenant defined');
    assert((typeof collections === 'undefined') || (Array.isArray(collections) && collections.length), 'tenant collection should contains at least one collection');

    if (typeof tenant !== 'undefined') {
        this.s.options.tenant = this.s.options.tenant || {};
        this.s.options.tenant.tenant = tenant;
    }
    if (typeof collections !== 'undefined') {
        this.s.options.tenant = this.s.options.tenant || {};
        this.s.options.tenant.collections = [...collections];
    }

    return this;
};

Db.getTenant = function () {
    return this.s.options.tenant && this.s.options.tenant.tenant;
};

Db.clearTeant = function () {
    delete this.s.options.tenant;
    return this;
};

Db.setDeletionMode = function (mode) {
    assert(['soft', 'hard'].includes(mode), 'mode could be only soft or hard');

    if (mode === 'soft') {
        delete this.s.options.deletionMode;
    } else {
        this.s.options.deletionMode = mode;
    }

    return this;
};

const {
    find,
    aggregate,
} = Collection;

Collection.setTenant = function (tenant) {
    assert(tenant, 'no tenant defined');

    this.s.options.tenant = tenant;

    return this;
};

Collection.getTenant = function () {
    if (this.s.options.tenant) {
        return this.s.options.tenant;
    }

    const { tenant, collections } = this.s.db.options.tenant || {};
    if (!tenant) {
        return null;
    }

    return collections.includes(this.s.name)
        ? tenant
        : null;
};

Collection.clearTenant = function () {
    delete this.s.options.tenant;
    return this;
};

Collection.find = function (query, options, callback) {
    // todo: undefined arguments remapping
    return find.call(this, query, { ...options, tenant: this.getTenant() }, callback);
};

Collection.aggregate = function (pipeline, options, callback) {
    // todo: undefined arguments remapping
    return aggregate.call(this, pipeline, { ...(options || {}), tenant: this.getTenant() }, callback);
};


function removeTenant(obj) {
    if (obj) {
        delete obj._tenant;
    }
    return obj;
}

function injectTenant(tenant, obj) {
    obj._tenant = tenant;
    return obj;
}
function injectSoftDeleteCheck(query) {
    query._deleted = { $exists: false };
    return query;
}

function injectTenantInPipeline(tenant, pipeline) {
    assert(Array.isArray(pipeline), 'pipeline should be an array');

    if (!pipeline[0] || !pipeline[0].$match) {
        pipeline.unshift({ $match: injectTenant(tenant, {}) });
    } else {
        injectTenant(tenant, pipeline[0].$match);
    }

    return pipeline;
}