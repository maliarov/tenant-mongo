const utils = require('mongodb/lib/utils');
const {executeOperation} = utils;

utils.executeOperation = function (topology, operation, args, options) {
    if (args[0].constructor.name === 'Collection') {
        const collection = args[0];
        const optionsArgumentIndex = args.length - 2;
        const options = {...(args[optionsArgumentIndex] || {}), tenant: collection.s.db.options.tenant };     
        args[optionsArgumentIndex] = options;
    }

    return executeOperation.call(this, topology, operation, args, options);
};