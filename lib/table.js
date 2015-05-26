(function() {
  var MySQLTable, _, _joinTypes, async, bcrypt, moment, utils,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  _ = require('lodash')._;

  moment = require('moment');

  async = require('async');

  bcrypt = require("bcrypt");

  utils = require("./utils");

  _joinTypes = ["inner", "left outer", "right outer"];

  module.exports = MySQLTable = (function(superClass) {
    extend(MySQLTable, superClass);

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
      this.settings = settings;
      this.ERRORS = bind(this.ERRORS, this);
      this._wrapCallback = bind(this._wrapCallback, this);
      this._afterSave = bind(this._afterSave, this);
      this._handleSave = bind(this._handleSave, this);
      this._handleList = bind(this._handleList, this);
      this._handleSingle = bind(this._handleSingle, this);
      this._getOptions = bind(this._getOptions, this);
      this._generateNewID = bind(this._generateNewID, this);
      this._validateField = bind(this._validateField, this);
      this._validate = bind(this._validate, this);
      this._insert = bind(this._insert, this);
      this._update = bind(this._update, this);
      this._crement = bind(this._crement, this);
      this.getFieldNames = bind(this.getFieldNames, this);
      this.mdel = bind(this.mdel, this);
      this.del = bind(this.del, this);
      this.decrement = bind(this.decrement, this);
      this.increment = bind(this.increment, this);
      this.count = bind(this.count, this);
      this.has = bind(this.has, this);
      this.insert = bind(this.insert, this);
      this.update = bind(this.update, this);
      this.set = bind(this.set, this);
      this._addJoin = bind(this._addJoin, this);
      this.find = bind(this.find, this);
      this.mget = bind(this.mget, this);
      this.get = bind(this.get, this);
      this.escape = bind(this.escape, this);
      this.initialize = bind(this.initialize, this);
      this.defaults = bind(this.defaults, this);
      this.factory = options.factory;
      this.getter("tablename", (function(_this) {
        return function() {
          return _this.settings.tablename;
        };
      })(this));
      this.getter("sIdField", (function(_this) {
        return function() {
          return _this.settings.sIdField;
        };
      })(this));
      this.getter("hasStringId", (function(_this) {
        return function() {
          return _this.settings.hasStringId || false;
        };
      })(this));
      this.getter("sortfield", (function(_this) {
        return function() {
          return _this.settings.sortfield || _this.sIdField;
        };
      })(this));
      this.getter("sortdirection", (function(_this) {
        return function() {
          return _this.settings.sortdirection || "desc";
        };
      })(this));
      this.getter("createIdString", (function(_this) {
        return function() {
          return _this.settings.createIdString || _this.config.createIdString;
        };
      })(this));
      this.define("limit", ((function(_this) {
        return function() {
          return _this.builder.defaultLimit;
        };
      })(this)), ((function(_this) {
        return function(_limit) {
          return _this.builder.defaultLimit = _limit;
        };
      })(this)));
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
      var jField, jSett, options, ref, sql;
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
      if (options.joins != null) {
        ref = options.joins;
        for (jField in ref) {
          jSett = ref[jField];
          if (!this._addJoin(sql, jField, jSett, cb)) {
            return;
          }
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

    MySQLTable.prototype._addJoin = function(sql, ownField, jSett, cb) {
      var _table, jSql, ref, ref1;
      _.defaults(jSett, {
        type: "inner",
        table: null,
        field: null,
        filter: null
      });
      if (!sql.hasField(ownField)) {
        this._handleError(cb, "invalid-join-field", {
          self: this.tablename,
          field: ownField
        });
        return false;
      }
      if ((ownField == null) && indexOf.call(sql.fieldNames, ownField) < 0) {
        this._handleError(cb, "missing-join-key", {
          self: this.tablename,
          field: ownField
        });
        return false;
      }
      if (jSett.table == null) {
        this._handleError(cb, "missing-join-table", {
          self: this.tablename
        });
        return false;
      } else if (!(jSett.table instanceof MySQLTable)) {
        _table = this.factory.get(jSett.table);
        if (_table == null) {
          this._handleError(cb, "invalid-join-table", {
            self: this.tablename,
            foreign: jSett.table
          });
          return false;
        }
        jSett.table = _table;
      }
      if (ref = jSett.type.toLowerCase(), indexOf.call(_joinTypes, ref) < 0) {
        this._handleError(cb, "invalid-join-type", {
          self: this.tablename,
          foreign: (ref1 = jSett.table) != null ? ref1.tablename : void 0
        });
        return false;
      }
      jSql = jSett.table.builder.clone();
      if (jSett.field == null) {
        jSett.field = jSql.idField;
      }
      if (!jSql.hasField(jSett.field)) {
        this._handleError(cb, "invalid-join-foreignfield", {
          self: this.tablename,
          foreign: jSql.table,
          field: jSett.field
        });
        return false;
      }
      sql.addJoin(jSett.type, ownField, jSql, jSett.field, jSett.filter);
      return true;
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
      var _valData, sql;
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
      this._validate(_valData, (function(_this) {
        return function(err, data) {
          if (err) {
            cb(err);
            return;
          }
          _this._update(_valData, cb);
        };
      })(this));
    };

    MySQLTable.prototype.insert = function(data, cb, options) {
      var _valData, sql;
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
      return this._validate(_valData, (function(_this) {
        return function(err) {
          if (err) {
            cb(err);
            return;
          }
          _this._insert(_valData, cb);
        };
      })(this));
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
      var _data, _fields, _type, options, sql, stmt;
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
      _fields = sql.fieldNames;
      _fields.push(field + " AS count");
      sql.setFields(_fields, true);
      _data = {};
      _data[field] = "crmt" + count;
      stmt = [sql.update(_data), sql.select(false)];
      this.factory.exec(stmt, this._handleSingle(_type, id, opt, cb));
    };

    MySQLTable.prototype._update = function(args, cb) {
      var _getStmt, data, id, options, sql, stmts;
      id = args.id, data = args.data, sql = args.sql, options = args.options;
      this.debug("update", id, data);
      sql.filter(this.sIdField, id);
      _getStmt = this.builder.clone().filter(this.sIdField, id).select(false);
      stmts = [_getStmt, sql.update(data), _getStmt];
      this.factory.exec(stmts, this._handleSave("set", id, data, options, sql, cb));
    };

    MySQLTable.prototype._insert = function(args, cb) {
      var _id, data, id, options, sql, stmts;
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
      var aFns, attr, i, len, ref;
      aFns = [];
      ref = args.sql.attrs;
      for (i = 0, len = ref.length; i < len; i++) {
        attr = ref[i];
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
      var data, id, isUpdate, options, sql;
      id = args.id, data = args.data, sql = args.sql, options = args.options, isUpdate = args.isUpdate;
      return (function(_this) {
        return function(cb) {
          var _date, _validation, base, base1, name, name1, ref, ref1, ref2, ref3, ref4, ref5, salt;
          options._afterSave || (options._afterSave = {});
          (base = options._afterSave)[name = field.name] || (base[name] = {});
          options._changedValues || (options._changedValues = {});
          (base1 = options._changedValues)[name1 = field.name] || (base1[name1] = null);
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
          if (_validation.setTimestamp === true && ((ref = field.type) === "string" || ref === "number" || ref === "S" || ref === "N" || ref === "unixtimestamp" || ref === "U" || ref === "timestamp" || ref === "T" || ref === "date" || ref === "D")) {
            options._changedValues[field.name] = data[field.name];
            data[field.name] = "now";
          }
          if (_validation.incrementOnSave === true && ((ref1 = field.type) === "number" || ref1 === "N")) {
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
            if ((ref2 = field.type) === "D" || ref2 === "date") {
              if (_.isString(value)) {
                _date = moment(value, sql.config.dateFormats);
              } else if (_.isDate(value) || _.isNumber(value)) {
                _date = moment(value);
              }
              if ((_date != null) && !isNaN(parseInt((ref3 = _this.config) != null ? (ref4 = ref3.factory) != null ? (ref5 = ref4.config) != null ? ref5.timezone : void 0 : void 0 : void 0, 10))) {
                value = _date.utcOffset(_this.config.factory.config.timezone).format("YYYY-MM-DD HH:mm:ss");
              } else if (_date != null) {
                value = _date.format("YYYY-MM-DD HH:mm:ss");
              }
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
      })(this);
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
      var args, cb, i, type;
      type = arguments[0], args = 3 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 1) : (i = 1, []), cb = arguments[i++];
      return (function(_this) {
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
      })(this);
    };

    MySQLTable.prototype._handleList = function() {
      var args, cb, filter, i, opt, sql, type;
      type = arguments[0], args = 3 <= arguments.length ? slice.call(arguments, 1, i = arguments.length - 1) : (i = 1, []), cb = arguments[i++];
      filter = args[0], opt = args[1], sql = args[2];
      return (function(_this) {
        return function(err, results, meta) {
          var ref;
          if (err != null) {
            cb(err);
            return;
          }
          if ((ref = opt.fields) === "idOnly" || ref === "idonly") {
            cb(null, _.pluck(results, _this.sIdField));
          } else {
            cb(null, _this.builder.convertToType(results));
          }
        };
      })(this);
    };

    MySQLTable.prototype._handleSave = function(type, id, data, options, sql, cb) {
      return (function(_this) {
        return function(err, results) {
          var _field, _val, _valData, ref, ref1;
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
            ref = options._afterSave;
            for (_field in ref) {
              _val = ref[_field];
              if (!_.isEmpty(_val)) {
                if (err.message.indexOf(_val.allreadyExistend) >= 0) {
                  _this._handleError(cb, "validation-already-existend", {
                    field: _field,
                    value: (options != null ? (ref1 = options._changedValues) != null ? ref1[_field] : void 0 : void 0) || data[_field]
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
      })(this);
    };

    MySQLTable.prototype._afterSave = function(results, id, data, options, cb) {
      var _errData, _field, _new, _old, _saveMeta, _val, ref, ref1;
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
      ref = options._afterSave;
      for (_field in ref) {
        _val = ref[_field];
        if (!(!_.isEmpty(_val))) {
          continue;
        }
        if ((id != null) && (_val.checkEqualOld != null) && _saveMeta.affectedRows === 0) {
          _errData = {
            value: (options != null ? (ref1 = options._changedValues) != null ? ref1[_field] : void 0 : void 0) || data[_field],
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
          this.emit(_field + "." + _val.fireEventOnChange, _old[_field], _new[_field], id, _new);
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
      if (this.config.returnFormat != null) {
        return (function(_this) {
          return function(err, ret) {
            var _ret, item;
            if (err != null) {
              cb(_this.config.returnFormat(err));
              return;
            }
            if (_.isArray(ret)) {
              _ret = (function() {
                var i, len, results1;
                results1 = [];
                for (i = 0, len = ret.length; i < len; i++) {
                  item = ret[i];
                  results1.push(this.config.returnFormat(null, item));
                }
                return results1;
              }).call(_this);
              cb(err, _ret);
            } else {
              cb(err, _this.config.returnFormat(null, ret));
            }
          };
        })(this);
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
        "no-filter": "You have to define at least one valid filter",
        "invalid-join-type": "You have to use a join type of `" + (_joinTypes.join("`, `")) + "`",
        "invalid-join-field": "You have to define a vailid field `<%= field %>` of the table `<%= self %>`",
        "invalid-join-foreignfield": "You have to define a vailid field `<%= field %>` of the table `<%= foreign %>` to join the table `<%= self %>`",
        "missing-join-table": "You have to define a foreign table joining this table `<%= self %>`",
        "invalid-join-table": "You have to define a existing foreign table `<%= foreign %>` as string or MySQLTable instance to join to this table `<%= self %>`"
      });
    };

    return MySQLTable;

  })(require("./basic"));

}).call(this);
