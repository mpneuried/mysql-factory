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
        createIdString: function() {
          return utils.randomString(5);
        },
        defaultBcryptRounds: 8,
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
      this._wrapCallback = __bind(this._wrapCallback, this);
      this._afterSave = __bind(this._afterSave, this);
      this._handleSave = __bind(this._handleSave, this);
      this._handleList = __bind(this._handleList, this);
      this._handleSingle = __bind(this._handleSingle, this);
      this._getOptions = __bind(this._getOptions, this);
      this._generateNewID = __bind(this._generateNewID, this);
      this._validateField = __bind(this._validateField, this);
      this._validate = __bind(this._validate, this);
      this._insert = __bind(this._insert, this);
      this._update = __bind(this._update, this);
      this._crement = __bind(this._crement, this);
      this.getFieldNames = __bind(this.getFieldNames, this);
      this.mdel = __bind(this.mdel, this);
      this.del = __bind(this.del, this);
      this.decrement = __bind(this.decrement, this);
      this.increment = __bind(this.increment, this);
      this.count = __bind(this.count, this);
      this.has = __bind(this.has, this);
      this.insert = __bind(this.insert, this);
      this.update = __bind(this.update, this);
      this.set = __bind(this.set, this);
      this.find = __bind(this.find, this);
      this.mget = __bind(this.mget, this);
      this.get = __bind(this.get, this);
      this.escape = __bind(this.escape, this);
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
      this.getter("createIdString", function() {
        return _this.settings.createIdString || _this.config.createIdString;
      });
      this.define("limit", (function() {
        return _this.builder.defaultLimit;
      }), (function(_limit) {
        return _this.builder.defaultLimit = _limit;
      }));
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
      }, this.escape);
      this.builder = new SQLBuilder();
      this.builder.table = this.tablename;
      this.builder.idField = this.sIdField;
      this.builder.usefieldsets = this.settings.useFieldsets;
      this.builder.attrs = this.settings.fields;
      this.builder.fields = "all";
      this.builder.orderfield = this.sortfield;
      this.builder.forward = this.sortdirection;
    };

    MySQLTable.prototype.escape = function(val) {
      return this.factory.pool.escape(val);
    };

    MySQLTable.prototype.get = function(id, cb, opt) {
      var options, sql;
      if (opt == null) {
        opt = {};
      }
      cb = this._wrapCallback(cb);
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
      cb = this._wrapCallback(cb);
      options = this._getOptions(opt, "get");
      sql = this.builder.clone();
      if (options.fields != null) {
        sql.fields = options.fields;
      }
      sql.filter(this.sIdField, ids);
      this.factory.exec(sql.select(), this._handleList("mget", ids, opt, sql, cb));
    };

    MySQLTable.prototype.find = function(filter, cb, opt) {
      var options, sql;
      if (opt == null) {
        opt = {};
      }
      cb = this._wrapCallback(cb);
      if ((filter == null) || !_.isObject(filter)) {
        this._handleError(cb, "invalid-filter");
        return;
      }
      options = this._getOptions(opt, "get");
      sql = this.builder.clone();
      if (options.fields != null) {
        sql.fields = options.fields;
      }
      if (options.orderby != null) {
        sql.orderfield = options.orderby;
      }
      if (options.forward != null) {
        sql.forward = options.forward;
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
      sql.filter(filter);
      if (options._customQueryFilter != null) {
        sql.filter(options._customQueryFilter);
      }
      if (options._customQueryEnd != null) {
        this._handleError(cb, "deprecated-option", {
          key: "_customQueryEnd"
        });
        return;
      }
      this.factory.exec(sql.select(), this._handleList("mget", filter, opt, sql, cb));
    };

    MySQLTable.prototype.set = function(id, data, cb, options) {
      var aL;
      cb = this._wrapCallback(cb);
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
      cb = this._wrapCallback(cb);
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

    MySQLTable.prototype.insert = function(data, cb, options) {
      var sql, _valData,
        _this = this;
      if (options == null) {
        options = {};
      }
      cb = this._wrapCallback(cb);
      sql = this.builder.clone();
      options.insertRetry = data[this.sIdField] != null ? +Infinity : 0;
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

    MySQLTable.prototype.has = function(id, cb, opt) {
      var options, sql;
      if (opt == null) {
        opt = {};
      }
      cb = this._wrapCallback(cb);
      options = this._getOptions(opt, "has");
      sql = this.builder.clone();
      sql.filter(this.sIdField, id);
      this.factory.exec(sql.count(), this._handleSingle("has", id, opt, cb));
    };

    MySQLTable.prototype.count = function(filter, cb, opt) {
      var options, sql;
      if (opt == null) {
        opt = {};
      }
      cb = this._wrapCallback(cb);
      options = this._getOptions(opt, "count");
      sql = this.builder.clone();
      if (options._customQueryEnd != null) {
        this._handleError(cb, "deprecated-option", {
          key: "_customQueryEnd"
        });
        return;
      }
      if (options._customQueryFilter != null) {
        sql.filter(options._customQueryFilter);
      }
      sql.filter(filter);
      this.factory.exec(sql.count(), this._handleSingle("count", filter, opt, cb));
    };

    MySQLTable.prototype.increment = function(id, field, cb, opt) {
      if (opt == null) {
        opt = {};
      }
      this._crement(id, field, +1, cb, opt);
    };

    MySQLTable.prototype.decrement = function(id, field, cb, opt) {
      if (opt == null) {
        opt = {};
      }
      this._crement(id, field, -1, cb, opt);
    };

    MySQLTable.prototype.del = function(id, cb, opt) {
      var options, sql, stmts;
      if (opt == null) {
        opt = {};
      }
      cb = this._wrapCallback(cb);
      options = this._getOptions(opt, "count");
      sql = this.builder.clone();
      sql.filter(this.sIdField, id);
      stmts = [sql.select(false), sql.del()];
      this.factory.exec(stmts, this._handleSingle("del", id, opt, cb));
    };

    MySQLTable.prototype.mdel = function(filter, cb, opt) {
      var options, sql, stmts;
      if (opt == null) {
        opt = {};
      }
      cb = this._wrapCallback(cb);
      options = this._getOptions(opt, "count");
      sql = this.builder.clone();
      sql.filter(filter);
      if (options._customQueryFilter != null) {
        sql.filter(options._customQueryFilter);
      }
      if (!sql.isFiltered) {
        this._handleError(cb, "no-filter");
        return;
      }
      stmts = [sql.select(false), sql.del()];
      this.factory.exec(stmts, this._handleSingle("mdel", filter, opt, sql, cb));
    };

    MySQLTable.prototype.getFieldNames = function(fields) {
      var _sql;
      _sql = this.builder.clone();
      if (fields != null) {
        _sql.fields = fields;
      }
      return _sql.fieldNames;
    };

    MySQLTable.prototype._crement = function(id, field, count, cb, opt) {
      var options, sql, stmt, _data, _type;
      if (opt == null) {
        opt = {};
      }
      cb = this._wrapCallback(cb);
      _type = count > 0 ? "increment" : "decrement";
      options = this._getOptions(opt, "count");
      sql = this.builder.clone();
      if (!sql.hasField(field)) {
        this._handleError(cb, "invalid-field", {
          method: _type,
          field: field
        });
        return;
      }
      sql.filter(this.sIdField, id);
      sql.setFields("" + sql.fields + ", " + field + " AS count", true);
      _data = {};
      _data[field] = "crmt" + count;
      stmt = [sql.update(_data), sql.select(false)];
      this.factory.exec(stmt, this._handleSingle(_type, id, opt, cb));
    };

    MySQLTable.prototype._update = function(args, cb) {
      var data, id, options, sql, stmts, _getStmt;
      id = args.id, data = args.data, sql = args.sql, options = args.options;
      this.debug("update", id, data);
      sql.filter(this.sIdField, id);
      _getStmt = this.builder.clone().filter(this.sIdField, id).select(false);
      stmts = [_getStmt, sql.update(data), _getStmt];
      this.factory.exec(stmts, this._handleSave("set", id, data, options, sql, cb));
    };

    MySQLTable.prototype._insert = function(args, cb) {
      var data, id, options, sql, stmts, _id;
      id = args.id, data = args.data, sql = args.sql, options = args.options;
      if (data[this.sIdField] != null) {
        _id = data[this.sIdField];
      } else {
        if (this.hasStringId) {
          _id = this._generateNewID();
          data[this.sIdField] = _id;
        } else {
          _id = {
            "fn": "LAST_INSERT_ID()"
          };
        }
      }
      this.debug("insert", data);
      stmts = [sql.insert(data)];
      stmts.push(this.builder.clone().filter(this.sIdField, _id).select(false));
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
        var salt, _base, _base1, _name, _name1, _ref, _ref1, _validation;
        options._afterSave || (options._afterSave = {});
        (_base = options._afterSave)[_name = field.name] || (_base[_name] = {});
        options._changedValues || (options._changedValues = {});
        (_base1 = options._changedValues)[_name1 = field.name] || (_base1[_name1] = null);
        _validation = field.validation || {};
        if (!isUpdate && _validation.isRequired === true && (value == null)) {
          _this._handleError(cb, "validation-required", {
            field: field.name
          });
          return;
        }
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
        if (_validation.setTimestamp === true && ((_ref = field.type) === "string" || _ref === "number" || _ref === "S" || _ref === "N" || _ref === "unixtimestamp" || _ref === "U" || _ref === "timestamp" || _ref === "T" || _ref === "date" || _ref === "D")) {
          options._changedValues[field.name] = data[field.name];
          data[field.name] = "now";
        }
        if (_validation.incrementOnSave === true && ((_ref1 = field.type) === "number" || _ref1 === "N")) {
          options._changedValues[field.name] = data[field.name];
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
              value: _validation.notAllowedForValue
            });
            return;
          } else {
            options._changedValues[field.name] = data[field.name];
            data[field.name] = "IF( " + field.name + " != \"" + _validation.notAllowedForValue + "\", \"" + value + "\", " + field.name + " )";
          }
        }
        if ((options != null ? options.equalOldValueIgnore : void 0) !== true && _validation.equalOldValue === true && isUpdate === true) {
          if (value == null) {
            _this._handleError(cb, "validation-notequal-required", {
              field: field.name
            });
            return;
          }
          sql.filter(field.name, value);
          options._afterSave[field.name].checkEqualOld = true;
        }
        if (_validation.fireEventOnChange != null) {
          options._afterSave[field.name].fireEventOnChange = _validation.fireEventOnChange;
        }
        if (_validation.allreadyExistend != null) {
          options._afterSave[field.name].allreadyExistend = _validation.allreadyExistend;
        }
        cb(null);
      };
    };

    MySQLTable.prototype._generateNewID = function(id) {
      if ((id == null) && this.hasStringId) {
        id = this.createIdString();
      }
      return id;
    };

    MySQLTable.prototype._getOptions = function(options, type) {
      var _opt;
      _opt = this.extend({
        fields: "all"
      }, options);
      return _opt;
    };

    MySQLTable.prototype._handleSingle = function() {
      var args, cb, type, _i,
        _this = this;
      type = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      return function(err, results, meta) {
        var _get, _ret, _save;
        if (err != null) {
          cb(err);
          return;
        }
        if (_.isArray(results)) {
          if (type === "increment" || type === "decrement" || type === "del") {
            if (type === "del") {
              _get = results[0], _save = results[1];
            } else {
              _save = results[0], _get = results[1];
            }
            if (!(_save != null ? _save.affectedRows : void 0)) {
              _this._handleError(cb, "not-found");
              return;
            }
            results = _.last(_get);
          } else if (type === "mdel") {
            _get = results[0], _save = results[1];
            if (!(_save != null ? _save.affectedRows : void 0)) {
              cb(null, []);
              return;
            }
            results = _get;
          } else {
            results = _.first(results);
          }
        }
        switch (type) {
          case "has":
            if ((results != null ? results.count : void 0) >= 1) {
              cb(null, true);
            } else {
              cb(null, false);
            }
            break;
          case "count":
          case "increment":
          case "decrement":
            if ((results != null ? results.count : void 0) >= 1) {
              cb(null, parseInt(results != null ? results.count : void 0, 10));
            } else {
              cb(null, 0);
            }
            _this.emit(type, null, _this.builder.convertToType(results));
            break;
          default:
            if (results == null) {
              _this._handleError(cb, "not-found");
              return;
            }
            _ret = _this.builder.convertToType(results);
            cb(null, _ret);
            _this.emit(type, null, _ret);
        }
      };
    };

    MySQLTable.prototype._handleList = function() {
      var args, cb, filter, opt, sql, type, _i,
        _this = this;
      type = arguments[0], args = 3 <= arguments.length ? __slice.call(arguments, 1, _i = arguments.length - 1) : (_i = 1, []), cb = arguments[_i++];
      filter = args[0], opt = args[1], sql = args[2];
      return function(err, results, meta) {
        var _ref;
        if (err != null) {
          cb(err);
          return;
        }
        if ((_ref = opt.fields) === "idOnly" || _ref === "idonly") {
          cb(null, _.pluck(results, _this.sIdField));
        } else {
          cb(null, _this.builder.convertToType(results));
        }
      };
    };

    MySQLTable.prototype._handleSave = function(type, id, data, options, sql, cb) {
      var _this = this;
      return function(err, results) {
        var _field, _ref, _ref1, _val, _valData;
        if (_this.hasStringId && (id == null) && (err != null ? err.code : void 0) === "ER_DUP_ENTRY" && err.message.indexOf("PRIMARY") >= 0 && (options != null ? options.insertRetry : void 0) < _this.config.stringIdInsertRetrys) {
          _this.warning("detected double sting id insert, so retry", data[_this.sIdField]);
          options.insertRetry++;
          data[_this.sIdField] = _this._generateNewID();
          _valData = {
            id: null,
            data: data,
            sql: sql,
            options: options
          };
          _this._insert(_valData, cb);
          return;
        } else if ((err != null ? err.code : void 0) === "ER_DUP_ENTRY") {
          _ref = options._afterSave;
          for (_field in _ref) {
            _val = _ref[_field];
            if (!_.isEmpty(_val)) {
              if (err.message.indexOf(_val.allreadyExistend) >= 0) {
                _this._handleError(cb, "validation-already-existend", {
                  field: _field,
                  value: (options != null ? (_ref1 = options._changedValues) != null ? _ref1[_field] : void 0 : void 0) || data[_field]
                });
                return;
              }
            }
          }
          cb(err);
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
      var _errData, _field, _new, _old, _ref, _ref1, _saveMeta, _val;
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
      _new = this.builder.convertToType(_new);
      if (_old != null) {
        _old = this.builder.convertToType(_old);
      }
      if ((id == null) && !this.hasStringId && _saveMeta.insertId !== _new.id) {
        this._handleError(cb, "wrong-insert-return");
      }
      _ref = options._afterSave;
      for (_field in _ref) {
        _val = _ref[_field];
        if (!(!_.isEmpty(_val))) {
          continue;
        }
        if ((id != null) && (_val.checkEqualOld != null) && _saveMeta.affectedRows === 0) {
          _errData = {
            value: (options != null ? (_ref1 = options._changedValues) != null ? _ref1[_field] : void 0 : void 0) || data[_field],
            field: {
              name: _field
            }
          };
          this._handleError(cb, "validation-notequal", {
            field: _field,
            curr: _old != null ? _old[_field] : void 0,
            value: _errData.value
          }, _errData);
          return;
        }
        if ((id != null) && (_val.fireEventOnChange != null) && (_old != null ? _old[_field] : void 0) !== (_new != null ? _new[_field] : void 0)) {
          this.emit("" + _field + "." + _val.fireEventOnChange, _old[_field], _new[_field], id, _new);
        }
      }
      if (_saveMeta.affectedRows === 0) {
        this._handleError(cb, "not-found");
        return;
      }
      this.emit("set", null, _new);
      cb(null, _new);
    };

    MySQLTable.prototype._wrapCallback = function(cb) {
      var _this = this;
      if (this.config.returnFormat != null) {
        return function(err, ret) {
          var item, _ret;
          if (err != null) {
            cb(_this.config.returnFormat(err));
            return;
          }
          if (_.isArray(ret)) {
            _ret = (function() {
              var _i, _len, _results;
              _results = [];
              for (_i = 0, _len = ret.length; _i < _len; _i++) {
                item = ret[_i];
                _results.push(this.config.returnFormat(null, item));
              }
              return _results;
            }).call(_this);
            cb(err, _ret);
          } else {
            cb(err, _this.config.returnFormat(null, ret));
          }
        };
      } else {
        return cb;
      }
    };

    MySQLTable.prototype.ERRORS = function() {
      return this.extend(MySQLTable.__super__.ERRORS.apply(this, arguments), {
        "not-found": "Element not found",
        "deprecated-option": "You tried to use the deprecated option: `<%= key %>`",
        "invalid-filter": "A filter has of the .find()` method to be an object",
        "too-few-arguments": "To use the `.<%= method %>()` method you have to define at least `<%= min %>` arguments",
        "validation-required": "The field `<%= field %>` is required.",
        "validation-notequal-required": "The field `<%= field %>` is required to do a validation equal the old value.",
        "value-not-allowed": "It's not allowed to write the value `<%= value %>`to the field `<%= field %>`",
        "wrong-insert-return": "The select after the insert query returns the wrong row.",
        "validation-notequal": "`equalOldValue` validation error. The value of `<%= field %>` do not match the current save value. You tried to save `<%= value %>` but `<%= curr %>` is necessary",
        "validation-already-existend": "The value `<%= value %>` for field `<%= field %>` already exists.",
        "invalid-field": "The field `<%= field %>` is not defined for the method `<%= method %>`",
        "no-filter": "You have to define at least one valid filter"
      });
    };

    return MySQLTable;

  })(require("./basic"));

}).call(this);
