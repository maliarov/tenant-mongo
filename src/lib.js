const utils = require('mongodb/lib/utils');

const { executeOperation } = utils;

utils.executeOperation = function (topology, operation, args, options) {
    if (args[0].constructor.name === 'Collection') {
        const collection = args[0];
        const optsArgumentIndex = args.length - 2;
        const opts = {
            ...(args[optsArgumentIndex] || {}),
            tenant: collection.s.db.options.tenant,
            deletionMode: collection.s.db.options.deletionMode
        };
        args[optsArgumentIndex] = opts;
    }

    return executeOperation.call(this, topology, operation, args, options);
};

const mongodb = require('mongodb');
require('./patch');
module.exports = mongodb;