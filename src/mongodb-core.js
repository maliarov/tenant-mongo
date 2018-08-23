const Server = require('mongodb-core/lib/topologies/server.js').prototype;
const Collection = require('mongodb/lib/collection.js').prototype;

const {
    command,
    insert,
    remove,
    update,
    cursor
} = Server;

Server.command = function (ns, cmd, options, callback) {
    const collection = cmd.findAndModify;
    const tenant = getTenantFor(collection, options.tenant);

    if (tenant) {
        if (cmd.query) {
            setTenant(tenant, cmd.query);
        }

        if (cmd.update) {
            ensureNoTenant(cmd.update);

            if (cmd.update.$set) {
                ensureNoTenant(cmd.update.$set);
            }
            if (cmd.update.$unset) {
                ensureNoTenant(cmd.update.$unset);
            }
        }
    }

    console.log('proxy: server.command', 'tenant', tenant);
    // console.log('-----------------------------');

    return command.call(this, ns, cmd, options, callback);
};

// Server.insert = function (...args) {
//     // console.error(new Error());
//     // console.log('........');

//     // const tenant = getTenant(this);
//     // if (tenant) {
//     //     const [, objs] = args;

//     //     (objs || []).forEach((obj) => {
//     //         ensureTenant(tenant, obj);
//     //     });
//     // }

//     // console.log('proxy: server.insert', ...args);
//     // console.log('-----------------------------');

//     return serverInsert.call(this, ...args);
// };

Server.remove = function (ns, ops, options, callback) {
    const collection = ns.replace(`${this.s.options.dbName}.`, '');
    const tenant = getTenantFor(collection, options.tenant);
    if (tenant) {
        ops.forEach((op) => {
            if (op.q) {
                setTenant(tenant, op.q);
            }
        });
    }

    //console.log('proxy: server.remove', ops);
    //console.log('-----------------------------');

    return remove.call(this, ns, ops, options, callback);
};

// Server.update = function (...args) {
//     console.log('proxy: server.update', ...args);
//     console.log('-----------------------------');

//     return serverUpdate.call(this, ...args);
// };

Server.cursor = function (ns, cmd, options) {
    const collection = cmd.find || cmd.aggregate;
    const tenant = getTenantFor(collection, options.tenant);

    if (tenant) {
        if (cmd.query) {
            ensureTenant(tenant, cmd.query);
        } else if (cmd.pipeline) {
            cmd.pipeline = ensureTenantInPipeline(tenant, cmd.pipeline);
        }
    }

    //console.log('proxy: server.cursor', JSON.stringify(cmd));
    // console.log('-----------------------------');

    return cursor.call(this, ns, cmd, options);
};


const {
    //     remove,
    //     save,
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





function getTenantFor(collection, { tenant, collections } = {}) {
    return (typeof tenant !== 'undefined' && (collections || []).includes(collection))
        ? tenant
        : null;
}

function ensureNoTenant(obj) {
    if (obj) {
        delete obj['_tenant'];
    }
}

function setTenant(tenant, obj) {
    return (obj['_tenant'] = tenant, obj);
}

function ensureTenantInPipeline(tenant, pipeline) {
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