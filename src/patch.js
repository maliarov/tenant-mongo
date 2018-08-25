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
    const collection = cmd.count || cmd.findAndModify;
    const tenant = getTenantFor(collection, options.tenant);

    //console.log('----------------command', tenant, cmd);

    if (tenant) {
        cmd.query = setTenant(tenant, cmd.query || {});
        cmd.query._deleted = { $exists: false };

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

    return command.call(this, ns, cmd, options, callback);
};

Server.cursor = function (ns, cmd, options) {
    const collection = getCollectionName(ns, this);
    const tenant = getTenantFor(collection, options.tenant);

    if (tenant) {
        if (cmd.query) {
            setTenant(tenant, cmd.query);
            cmd.query._deleted = { $exists: false };
        } else if (cmd.pipeline) {
            cmd.pipeline = setTenantInPipeline(tenant, cmd.pipeline);
            cmd.pipeline[0].$match._deleted = { $exists: false };
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
            const collection = getCollectionName(ns, this);
            const tenant = getTenantFor(collection, options.tenant);

            //console.log(`----------------${name}`, tenant, ops, options);

            if (tenant) {
                switch (true) {
                    case method === update:
                        (ops || []).forEach((op) => {
                            op.q = setTenant(tenant, op.q || {});
                            op.q._deleted = { $exists: false };

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
                            setTenant(tenant, op);
                            op.createdDate = new Date();
                            op.lastModifiedDate = new Date();
                        });
                        break;

                    case method === remove:
                        if (!options.deletionMode /* soft */) {
                            return Server.update.call(this, ns, ops, { ...options, forceSoftDelete: true }, callback);
                        }

                        (ops || []).forEach((op) => {
                            op.q = setTenant(tenant, op.q || {});
                            op.q._deleted = { $exists: false };
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
    //     remove,
    //     save,
    find,
    //     findOne,

    //     count,
    //     estimatedDocumentCount,

    //     countDocuments,
    //     distinct,

    //     findOneAndDelete,
    //     findOneAndReplace,
    //     findOneAndUpdate,
    //     findAndModify,
    //     findAndRemove,

    aggregate,
    //     watch,

    //     geoHaystackSearch,
    //     group,
    //     mapReduce,

} = Collection;

// Collection.prototype.remove = deprecate(function(selector, options, callback) {
//     return save.call(this, doc, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.save = function(doc, options, callback) {
//     return save.call(this, doc, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

Collection.find = function (query, options, callback) {
    // todo: undefined arguments remapping
    return find.call(this, query, { ...options, tenant: this.s.db.options.tenant }, callback);
};

// Collection.findOne = function (query, options, callback) {
//     return findOne.call(this, query, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.count = function(query, options, callback) {
//     return count.call(this, query, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.estimatedDocumentCount = function(options, callback) {
//     throw new Error('not implemented yet');
// };


// Collection.countDocuments = function(query, options, callback) {
//     return countDocuments(query, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.distinct = function (key, query, options, callback) {
//     return distinct.call(this, key, query, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.findOneAndDelete = function (filter, options, callback) {
//     return findOneAndDelete.call(this, filter, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.findOneAndReplace = function (filter, replacement, options, callback) {
//     return findOneAndReplace.call(this, filter, replacement, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.findOneAndUpdate = function (filter, update, options, callback) {
//     return findOneAndUpdate.call(this, filter, update, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.findAndModify = function (query, sort, doc, options, callback) {
//     return findAndModify.call(this, query, sort, doc, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.findAndRemove = function (query, sort, options, callback) {
//     return findAndRemove.call(this, query, sort, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

Collection.aggregate = function (pipeline, options, callback) {
    // todo: undefined arguments remapping
    return aggregate.call(this, pipeline, { ...(options || {}), tenant: this.s.db.options.tenant }, callback);
};

// Collection.watch = function (pipeline, options) {
//     return watch.call(this, pipeline, { ...options, tenant: this.s.db.options.tenant });
// };

// Collection.geoHaystackSearch = function (x, y, options, callback) {
//     return geoHaystackSearch.call(this, x, y, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

// Collection.group = function (keys, condition, initial, reduce, finalize, command, options, callback) {
//     return group.call(
//         this,
//         keys,
//         condition,
//         initial,
//         reduce,
//         finalize,
//         command,
//         { ...options, tenant: this.s.db.options.tenant },
//         callback);
// };

// Collection.mapReduce = function (map, reduce, options, callback) {
//     return mapReduce.call(this, map, reduce, { ...options, tenant: this.s.db.options.tenant }, callback);
// };

function getCollectionName(ns, server) {
    return ns.replace(`${server.s.options.dbName}.`, '');
}

function getTenantFor(collection, { tenant, collections } = {}) {
    return (typeof tenant !== 'undefined' && (collections || []).includes(collection))
        ? tenant
        : null;
}

function removeTenant(obj) {
    if (obj) {
        delete obj._tenant;
    }
    return obj;
}

function setTenant(tenant, obj) {
    obj._tenant = tenant;
    return obj;
}

function setTenantInPipeline(tenant, pipeline) {
    if (!Array.isArray(pipeline)) {
        pipeline = [pipeline];
    }

    if (!pipeline[0] || !pipeline[0].$match) {
        pipeline.unshift({ $match: setTenant(tenant, {}) });
    } else {
        setTenant(tenant, pipeline[0].$match);
    }

    return pipeline;
}