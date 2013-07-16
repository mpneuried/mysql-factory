(function() {
  var MySQLTable, async, bcrypt, moment, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  _ = require('lodash')._;

  moment = require('moment');

  async = require('async');

  bcrypt = require("bcrypt");

  utils = require("./utils");

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
        createIdString: null,
        defaultBcryptRounds: 8,
        createIdString: function() {
          return utils.randomString(5);
        },
        stringIdInsertRetrys: 5
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
      this._afterSave = __bind(this._afterSave, this);
      this._handleSave = __bind(this._handleSave, this);
      this._handleList = __bind(this._handleList, this);
      this._handleSingle = __bind(this._handleSingle, this);
      this._getOptions = __bind(this._getOptions, this);
      this._generateNewID = __bind(this._generateNewID, this);
      this._validateField = __bind(this._validateField, this);
      this._validate = __bind(this._validate, this);
      this._insert = __bind(this._insert, this);
      this.insert = __bind(this.insert, this);
      this._update = __bind(this._update, this);
      this.update = __bind(this.update, this);
      this.set = __bind(this.set, this);
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

    MySQLTable.prototype.set = function(id, data, cb, options) {
      var aL;
      aL = arguments.length;
      switch (aL) {
        case 4:
          this.update(id, data, cb, options);
          break;
        case 3:
          if (_.isFunction(data)) {
            this.insert(id, data, cb);
          } else {
            this.update(id, data, cb, {});
          }
          break;
        case 2:
          this.insert(id, data, {});
          break;
        case 1:
          this._handleError(cb, "too-few-arguments", {
            method: "set",
            min: 2
          });
      }
    };

    MySQLTable.prototype.update = function(id, data, cb, options) {
      var sql, _valData,
        _this = this;
      if (options == null) {
        options = {};
      }
      sql = this.builder.clone();
      _valData = {
        isUpdate: true,
        id: id,
        data: data,
        sql: sql,
        options: options
      };
      this._validate(_valData, function(err, data) {
        if (err) {
          cb(err);
          return;
        }
        _this._update(_valData, cb);
      });
    };

    MySQLTable.prototype._update = function(args, cb) {
      var data, id, options, sql, stmts, _getStmt;
      id = args.id, data = args.data, sql = args.sql, options = args.options;
      this.debug("update", id, data);
      sql.filter(sql.idField, id);
      _getStmt = this.builder.clone().filter(sql.idField, id).select(false);
      stmts = [_getStmt, sql.update(data), _getStmt];
      this.factory.exec(stmts, this._handleSave("set", id, data, options, sql, cb));
    };

    MySQLTable.prototype.insert = function(data, cb, options) {
      var sql, _valData,
        _this = this;
      if (options == null) {
        options = {};
      }
      sql = this.builder.clone();
      options.insertRetry = 0;
      _valData = {
        isUpdate: false,
        id: null,
        data: data,
        sql: sql,
        options: options
      };
      return this._validate(_valData, function(err) {
        if (err) {
          cb(err);
          return;
        }
        _this._insert(_valData, cb);
      });
    };

    MySQLTable.prototype._insert = function(args, cb) {
      var data, id, options, sql, stmts, _id;
      id = args.id, data = args.data, sql = args.sql, options = args.options;
      if (data[sql.idField] != null) {
        _id = data[sql.idField];
      } else {
        if (this.hasStringId) {
          _id = this._generateNewID();
          data[sql.idField] = _id;
        } else {
          _id = {
            "fn": "LAST_INSERT_ID()"
          };
        }
      }
      this.debug("insert", data);
      stmts = [sql.insert(data)];
      stmts.push(this.builder.clone().filter(sql.idField, _id).select(false));
      this.factory.exec(stmts, this._handleSave("set", null, data, options, sql, cb));
    };

    MySQLTable.prototype._validate = function(args, cb) {
      var aFns, attr, _i, _len, _ref,
        _this = this;
      aFns = [];
      _ref = args.sql.attrs;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        aFns.push(this._validateField(attr, args.data[attr.name], args));
      }
      async.parallel(aFns, function(err, results) {
        if (err) {
          cb(err);
          return;
        }
        cb(null);
      });
    };

    MySQLTable.prototype._validateField = function(field, value, args) {
      var data, id, isUpdate, options, sql,
        _this = this;
      id = args.id, data = args.data, sql = args.sql, options = args.options, isUpdate = args.isUpdate;
      return function(cb) {
        var salt, _base, _name, _ref, _ref1, _validation;
        options._afterSave || (options._afterSave = {});
        (_base = options._afterSave)[_name = field.name] || (_base[_name] = {});
        _validation = field.validation || {};
        if (!isUpdate && _validation.isRequired === true && (value == null)) {
          _this._handleError(cb, "validation-required", {
            field: field.name
          });
          return;
        }
        if ((_validation.bcrypt != null) && (value != null)) {
          salt = bcrypt.genSaltSync(_validation.bcrypt.rounds || _this.config.defaultBcryptRounds);
          data[field.name] = bcrypt.hashSync(value, salt);
        }
        if (_validation.setTimestamp === true && ((_ref = field.type) === "string" || _ref === "number" || _ref === "S" || _ref === "N" || _ref === "timestamp" || _ref === "T" || _ref === "date" || _ref === "D")) {
          data[field.name] = "now";
        }
        if (_validation.incrementOnSave === true && ((_ref1 = field.type) === "number" || _ref1 === "N")) {
          if (isUpdate) {
            data[field.name] = "incr";
          } else {
            data[field.name] = 0;
          }
        }
        if ((_validation.notAllowedForValue != null) && (value != null)) {
          if (value === _validation.notAllowedForValue) {
            _this._handleError(cb, "value-not-allowed", {
              field: field.name,
              value: validation.notAllowedForValue
            });
            return;
          } else {
            data[field.name] = "IF( " + field.name + " != \"" + _validation.notAllowedForValue + "\", \"" + value + "\", " + field.name + " )";
          }
        }
        if ((options != null ? options.equalOldValueIgnore : void 0) !== true && _validation.equalOldValue === true && isUpdate === true && (value != null)) {
          sql.filter(field.name, value);
          options._afterSave[field.name].checkEqualOld = true;
        }
        if (_validation.fireEventOnChange != null) {
          options._afterSave[field.name].fireEventOnChange = _validation.fireEventOnChange;
        }
        if (_validation.allreadyExistend === true) {
          options._afterSave[field.name].allreadyExistend = true;
        }
        cb(null);
      };
    };

    MySQLTable.prototype._generateNewID = function(id) {
      if (id == null) {
        id = this.config.createIdString();
      }
      return id;
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

    MySQLTable.prototype._handleSave = function(type, id, data, options, sql, cb) {
      var _this = this;
      return function(err, results) {
        var _valData;
        if (_this.hasStringId && (id == null) && (err != null ? err.code : void 0) === "ER_DUP_ENTRY" && err.message.indexOf("PRIMARY") && (data[sql.idField] == null) && (options != null ? options.insertRetry : void 0) < _this.config.stringIdInsertRetrys) {
          _this.warning("detected double sting id insert, so retry", data[sql.idField]);
          options.insertRetry++;
          _valData = {
            id: null,
            data: data,
            sql: sql,
            options: options
          };
          _this._insert(_valData, cb);
          return;
        } else if (err != null) {
          cb(err);
          return;
        }
        _this._afterSave(results, id, data, options, function(err, item) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, item);
        });
      };
    };

    MySQLTable.prototype._afterSave = function(results, id, data, options, cb) {
      var _field, _new, _old, _ref, _saveMeta, _val;
      if (id != null) {
        _old = results[0], _saveMeta = results[1], _new = results[2];
      } else {
        _saveMeta = results[0], _new = results[1];
      }
      if ((_new != null) && _.isArray(_new)) {
        _new = _.first(_new);
      }
      if ((_old != null) && _.isArray(_old)) {
        _old = _.first(_old);
      }
      if ((id == null) && !this.hasStringId && _saveMeta.insertId !== _new.id) {
        this._handleError(cb, "wrong-insert-return");
      }
      _ref = options._afterSave;
      for (_field in _ref) {
        _val = _ref[_field];
        if (!_.isEmpty(_val)) {
          if ((id != null) && (_val.fireEventOnChange != null) && _old[_field] !== _new[_field]) {
            this.emit("" + _field + "." + _val.fireEventOnChange, _field, _old[_field], _new[_field]);
          }
        }
      }
      cb(null, this.builder.convertToType(_new));
    };

    MySQLTable.prototype.ERRORS = function() {
      return this.extend(MySQLTable.__super__.ERRORS.apply(this, arguments), {
        "not-found": "Element not found",
        "deprecated-option": "You tried to use the deprecated option: `<%= key %>`",
        "invalid-filter": "A filter has of the .find()` method to be an object",
        "too-few-arguments": "To use the `.<%= method %>()` method you have to define at least `<%= min %>` arguments",
        "validation-required": "The field `<%= field %>` is required.",
        "value-not-allowed": "It's not allowed to write the value `<%= value %>`to the field `<%= field %>`",
        "wrong-insert-return": "The select after the insert query returns the wrong row."
      });
    };

    return MySQLTable;

  })(require("./basic"));

}).call(this);
