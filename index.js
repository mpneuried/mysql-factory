(function() {
  exports.version = '0.1.17';

  exports.getSqlBuilder = require('./lib/sql');

  exports.utils = require('./lib/utils');

  module.exports = require('./lib/factory');

}).call(this);
