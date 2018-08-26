const utils = require('mongodb/lib/utils');
require('./prePatch');
const mongodb = require('mongodb');
require('./postPatch');
module.exports = mongodb;