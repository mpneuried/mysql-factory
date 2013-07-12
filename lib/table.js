(function() {
  var MySQLTable, moment, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  _ = require('lodash')._;

  moment = require('moment');

  module.exports = MySQLTable = (function(_super) {
    __extends(MySQLTable, _super);

    MySQLTable.prototype.defaults = function() {
      return this.extend(MySQLTable.__super__.defaults.apply(this, arguments), {
        tablename: null,
        sIdField: "id",
        hasStringId: false,
        useFieldsets: false,
        sortfield: "id",
        sortdirection: "decs",
        fields: {},
        createIdString: null
      });
    };

    /*	
    	## constructor 
    
    	`new MySQLTable( _model_settings, options )`
    	
    	Define the getter and setter and configure teh table.
    
    	@param {Object} _model_settings Model configuration.
    	@param {Object} options Basic config object
    */


    function MySQLTable(settings, options) {
      var _this = this;
      this.settings = settings;
      this.ERRORS = __bind(this.ERRORS, this);
      this._handleList = __bind(this._handleList, this);
      this._handleSingle = __bind(this._handleSingle, this);
      this._getOptions = __bind(this._getOptions, this);
      this.find = __bind(this.find, this);
      this.mget = __bind(this.mget, this);
      this.get = __bind(this.get, this);
      this.initialize = __bind(this.initialize, this);
      this.defaults = __bind(this.defaults, this);
      this.factory = options.factory;
      this.getter("tablename", function() {
        return _this.settings.tablename;
      });
      this.getter("sIdField", function() {
        return _this.settings.sIdField;
      });
      this.getter("hasStringId", function() {
        return _this.settings.hasStringId || false;
      });
      this.getter("sortfield", function() {
        return _this.settings.sortfield || _this.sIdField;
      });
      this.getter("sortdirection", function() {
        return _this.settings.sortdirection || "desc";
      });
      MySQLTable.__super__.constructor.call(this, options);
      this.info("init table", this.tablename, this.sIdField);
      return;
    }

    /*
    	## initialize
    	
    	`table.initialize()`
    	
    	Initialize the Table object
    	
    	@api private
    */


    MySQLTable.prototype.initialize = function() {
      var SQLBuilder;
      SQLBuilder = (require("./sql"))({
        logging: this.config.logging
      });
      this.builder = new SQLBuilder();
      this.builder.table = this.tablename;
      this.builder.idField = this.sIdField;
      this.builder.usefieldsets = this.settings.useFieldsets;
      this.builder.attrs = this.settings.fields;
      this.builder.fields = "all";
      this.builder.orderfield = this.sortfield;
      this.builder.forward = this.sortdirection;
    };

    MySQLTable.prototype.get = function(id, cb, opt) {
      var options, sql;
      if (opt == null) {
        opt = {};
      }
      options = this._getOptions(opt, "get");
      sql = this.builder.clone();
      if (options.fields != null) {
        sql.fields = options.fields;
      }
      sql.filter(this.sIdField, id);
      this.factory.exec(sql.select(false), this._handleSingle("get", id, opt, cb));
    };

    MySQLTable.prototype.mget = function(ids, cb, opt) {
      var options, sql;
      if (opt == null) {
        opt = {};
      }
      options = this._getOptions(opt, "get");
      sql = this.builder.clone();
      if (options.fields != null) {
        sql.fields = options.fields;
      }
      sql.filter(this.sIdField, ids);
      this.factory.exec(sql.select(), this._handleList("mget", ids, opt, cb));
    };

    MySQLTable.prototype.find = function(filter, cb, opt) {
      var options, sql;
      if (opt == null) {
        opt = {};
      }
      if ((filter == null) || !_.isObject(filter)) {
        this._handleError(cb, "invalid-filter");
        return;
      }
      options = this._getOptions(opt, "get");
      sql = this.builder.clone();
      if (options.fields != null) {
        sql.fields = options.fields;
      }
      if ((filter != null ? filter.limit : void 0) != null) {
        sql.limit = filter.limit;
        if (filter.offset != null) {
          sql.offset = filter.offset;
        }
        filter = _.omit(filter, ["offset", "limit"]);
      } else if ((options != null ? options.limit : void 0) != null) {
        sql.limit = options.limit;
        if (options.offset != null) {
          sql.offset = options.offset;
        }
      }
      if (options._customQueryFilter != null) {
        this._handleError(cb, "deprecated-option", {
          key: "_customQueryFilter"
        });
        return;
      }
      sql.filter(filter);
      this.factory.exec(sql.select(), this._handleList("mget", filter, opt, cb));
    };

    MySQLTable.prototype._getOptions = function(options, type) {
      var _opt;
      _opt = this.extend({
        fields: "all",
        _customQueryEnd: ""
      }, options);
      return _opt;
    };

    MySQLTable.prototype._handleSingle = function() {
      var args, cb, type, _i,
        _this = this;
      type = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      return function(err, results, meta) {
        if (err != null) {
          cb(err);
          return;
        }
        if (_.isArray(results)) {
          results = _.first(results);
        }
        if (results == null) {
          _this._handleError(cb, "not-found");
          return;
        }
        cb(null, results);
      };
    };

    MySQLTable.prototype._handleList = function() {
      var args, cb, type, _i,
        _this = this;
      type = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      return function(err, results, meta) {
        if (err != null) {
          cb(err);
          return;
        }
        cb(null, results);
      };
    };

    MySQLTable.prototype.ERRORS = function() {
      return this.extend(MySQLTable.__super__.ERRORS.apply(this, arguments), {
        "not-found": "Element not found",
        "deprecated-option": "You tried to use the deprecated option: `<% key %>`",
        "invalid-filter": "A filter has of the .find()` method to be an object"
      });
    };

    return MySQLTable;

  })(require("./basic"));

}).call(this);
