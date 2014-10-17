(function() {
  var moment, mysql, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  mysql = require('mysql');

  utils = require('./utils');

  moment = require('moment');

  _ = require('lodash')._;

  module.exports = function(options, escape) {
    var SQLBuilder;
    if (escape == null) {
      escape = mysql.escape;
    }
    return SQLBuilder = (function(_super) {
      __extends(SQLBuilder, _super);

      SQLBuilder.prototype.defaults = function() {
        return this.extend(SQLBuilder.__super__.defaults.apply(this, arguments), {
          fields: ["*"],
          limit: 1000,
          standardFilterCombine: "AND"
        });
      };


      /*	
      		 *# constructor 
      
      		`new SQLBuilder( _c )`
      		
      		A SQL Builder instance to generate SQL statements
      
      		@param {Object} _c Basic internal config data. Used to clone a Instance
       */

      function SQLBuilder(_c) {
        var _base, _base1, _base2, _base3, _base4, _base5, _base6;
        this._c = _c != null ? _c : {};
        this.ERRORS = __bind(this.ERRORS, this);
        this._generateSetCommand = __bind(this._generateSetCommand, this);
        this._getSaveVariables = __bind(this._getSaveVariables, this);
        this._getAttrConfig = __bind(this._getAttrConfig, this);
        this._validateAttributes = __bind(this._validateAttributes, this);
        this.getJoins = __bind(this.getJoins, this);
        this.hasJoins = __bind(this.hasJoins, this);
        this.getFilters = __bind(this.getFilters, this);
        this.hasFilter = __bind(this.hasFilter, this);
        this.getDefaultLimit = __bind(this.getDefaultLimit, this);
        this.setDefaultLimit = __bind(this.setDefaultLimit, this);
        this.getLimit = __bind(this.getLimit, this);
        this.setLimit = __bind(this.setLimit, this);
        this.getUseFieldsets = __bind(this.getUseFieldsets, this);
        this.setUseFieldsets = __bind(this.setUseFieldsets, this);
        this.getFieldNames = __bind(this.getFieldNames, this);
        this.getFields = __bind(this.getFields, this);
        this.setFields = __bind(this.setFields, this);
        this.getWhere = __bind(this.getWhere, this);
        this.getOrderBy = __bind(this.getOrderBy, this);
        this.getForward = __bind(this.getForward, this);
        this.setForward = __bind(this.setForward, this);
        this.getOrderField = __bind(this.getOrderField, this);
        this.setOrderField = __bind(this.setOrderField, this);
        this.getArrayAttrKeys = __bind(this.getArrayAttrKeys, this);
        this.getAttrKeys = __bind(this.getAttrKeys, this);
        this.getAttrs = __bind(this.getAttrs, this);
        this.setAttrs = __bind(this.setAttrs, this);
        this.getIdField = __bind(this.getIdField, this);
        this.setIdField = __bind(this.setIdField, this);
        this.getTable = __bind(this.getTable, this);
        this.setTable = __bind(this.setTable, this);
        this.hasField = __bind(this.hasField, this);
        this.convertToType = __bind(this.convertToType, this);
        this.setToArray = __bind(this.setToArray, this);
        this.filterGroup = __bind(this.filterGroup, this);
        this.and = __bind(this.and, this);
        this.or = __bind(this.or, this);
        this.addJoin = __bind(this.addJoin, this);
        this.filter = __bind(this.filter, this);
        this.del = __bind(this.del, this);
        this.count = __bind(this.count, this);
        this.select = __bind(this.select, this);
        this.update = __bind(this.update, this);
        this.insert = __bind(this.insert, this);
        this.clone = __bind(this.clone, this);
        this.initialize = __bind(this.initialize, this);
        this.defaults = __bind(this.defaults, this);
        (_base = this._c).attrs || (_base.attrs = []);
        (_base1 = this._c).attrKeys || (_base1.attrKeys = []);
        (_base2 = this._c).attrNames || (_base2.attrNames = []);
        (_base3 = this._c).attrsArrayKeys || (_base3.attrsArrayKeys = []);
        (_base4 = this._c).fieldsets || (_base4.fieldsets = {});
        (_base5 = this._c).fieldlist || (_base5.fieldlist = []);
        (_base6 = this._c).joins || (_base6.joins = []);
        SQLBuilder.__super__.constructor.call(this, options);
        return;
      }


      /*
      		 *# initialize
      		
      		`sql.initialize()`
      		
      		Initialize the SQLBuilder ánd define the properties
      
      		@api private
       */

      SQLBuilder.prototype.initialize = function() {
        this.define("table", this.getTable, this.setTable);
        this.define("idField", this.getIdField, this.setIdField);
        this.define("attrs", this.getAttrs, this.setAttrs);
        this.getter("attrKeys", this.getAttrKeys);
        this.getter("attrArrayKeys", this.getArrayAttrKeys);
        this.define("fields", this.getFields, this.setFields);
        this.getter("fieldNames", this.getFieldNames);
        this.define("usefieldsets", this.getUseFieldsets, this.setUseFieldsets);
        this.define("limit", this.getLimit, this.setLimit);
        this.getter("orderby", this.getOrderBy);
        this.define("orderfield", this.getOrderField, this.setOrderField);
        this.define("forward", this.getForward, this.setForward);
        this.getter("where", this.getWhere);
        this.getter("joins", this.getJoins);
        this.getter("hasJoins", this.hasJoins);
        this.getter("isFiltered", this.hasFilter);
        this.define("defaultLimit", this.getDefaultLimit, this.setDefaultLimit);
        this.log("debug", "initialized");
      };


      /*
      		 *# clone
      		
      		`sql.clone()`
      		
      		Clone the current state of the SQLBuilder
      		
      		@return { SQLBuilder } The cloned Instance
      		
      		@api public
       */

      SQLBuilder.prototype.clone = function() {
        this.log("debug", "run clone");
        return new SQLBuilder(JSON.parse(JSON.stringify(this._c)));
      };


      /*
      		 *# insert
      		
      		`sql.insert( attributes )`
      		
      		Create a insert statement
      		
      		@param { Object } attributes Attributes to save 
      		
      		@return { String } Insert statement 
      		
      		@api public
       */

      SQLBuilder.prototype.insert = function(attributes) {
        var statement, _keys, _ref, _vals;
        attributes = this._validateAttributes(true, attributes);
        statement = [];
        statement.push("INSERT INTO " + this.table);
        _ref = this._getSaveVariables(attributes, true), _keys = _ref[0], _vals = _ref[1];
        statement.push("( " + (_keys.join(", ")) + " )");
        statement.push("VALUES ( " + (_vals.join(", ")) + " )");
        return _.compact(statement).join("\n");
      };


      /*
      		 *# update
      		
      		`sql.update( attributes )`
      		
      		Create a update statement
      		
      		@param { Object } attributes Attributes to update 
      		
      		@return { String } update statement 
      		
      		@api public
       */

      SQLBuilder.prototype.update = function(attributes) {
        var statement, _i, _idx, _key, _keys, _len, _ref, _sets, _vals;
        attributes = this._validateAttributes(false, attributes);
        statement = [];
        statement.push("UPDATE " + this.table);
        _ref = this._getSaveVariables(attributes, false), _keys = _ref[0], _vals = _ref[1];
        _sets = [];
        for (_idx = _i = 0, _len = _keys.length; _i < _len; _idx = ++_i) {
          _key = _keys[_idx];
          _sets.push("" + _key + " = " + _vals[_idx]);
        }
        statement.push("SET " + (_sets.join(", ")));
        statement.push(this.where);
        return _.compact(statement).join("\n");
      };


      /*
      		 *# select
      		
      		`sql.select( [complex] )`
      		
      		Create a select statement
      		
      		@param { Boolean } complex Create a complex select with order by and select
      		
      		@return { String } select statement 
      		
      		@api public
       */

      SQLBuilder.prototype.select = function(complex) {
        var statement;
        if (complex == null) {
          complex = true;
        }
        statement = [];
        statement.push("SELECT " + this.fields);
        statement.push("FROM " + this.table);
        if (this.hasJoins != null) {
          statement.push("" + this.joins);
        }
        statement.push(this.where);
        if (complex) {
          statement.push(this.orderby);
          statement.push(this.limit);
        }
        return _.compact(statement).join("\n");
      };


      /*
      		 *# count
      		
      		`sql.count( [complex] )`
      		
      		Create a count statement
      		
      		@return { String } count statement 
      		
      		@api public
       */

      SQLBuilder.prototype.count = function() {
        var statement;
        statement = [];
        statement.push("SELECT COUNT( " + this.idField + " ) as count");
        statement.push("FROM " + this.table);
        statement.push(this.where);
        return _.compact(statement).join("\n");
      };


      /*
      		 *# delete
      		
      		`sql.delete( [complex] )`
      		
      		Create a delete statement
      		
      		@return { String } delete statement 
      		
      		@api public
       */

      SQLBuilder.prototype.del = function() {
        var statement;
        statement = [];
        statement.push("DELETE");
        statement.push("FROM " + this.table);
        statement.push(this.where);
        return _.compact(statement).join("\n");
      };


      /*
      		 *# filter
      		
      		`sql.filter( key, pred )`
      		
      		Define a filter criteria which will be used by the `.getWhere()` method
      		
      		@param { String|Object } key The filter key or a Object of key and predicate 
      		@param { Object|String|Number } pred A prediucate object. For details see [Jed's Predicates ](https://github.com/jed/dynamo/wiki/High-level-API#wiki-predicates)
      		
      		@return { SQLBuilder } Returns itself for chaining
      		
      		@api public
       */

      SQLBuilder.prototype.filter = function(key, pred) {
        var subtable, _base, _cbn, _filter, _k, _operand, _pred, _ref, _val;
        (_base = this._c).filters || (_base.filters = []);
        this.log("debug", "filter", key, pred);
        if (_.isObject(key)) {
          for (_k in key) {
            _pred = key[_k];
            this.filter(_k, _pred);
          }
        } else {
          if (this._c.attrNames.length && __indexOf.call(this._c.attrNames, key) < 0) {
            this.info("invalid filter", this.table, key);
            return this;
          }
          _filter = "" + this.table + "." + key + " ";
          if (pred === null) {
            _filter += "is NULL";
          } else if (_.isString(pred) || _.isNumber(pred)) {
            _filter += "= " + (escape(pred));
          } else if (_.isArray(pred)) {
            _filter += "in ( " + (escape(pred)) + ")";
          } else {
            _operand = Object.keys(pred)[0];
            _val = pred[_operand];
            switch (_operand) {
              case "fn":
                if (_val != null) {
                  _filter += _val != null ? "= " + _val : void 0;
                }
                break;
              case "==":
                _filter += _val != null ? "= " + (escape(_val)) : "is NULL";
                break;
              case "!=":
                _filter += _val != null ? "!= " + (escape(_val)) : "is not NULL";
                break;
              case ">":
              case "<":
              case "<=":
              case ">=":
                if (_.isArray(_val)) {
                  _filter += "between " + (escape(_val[0])) + " and " + (escape(_val[1]));
                } else {
                  _filter += "" + _operand + " " + (escape(_val));
                }
                break;
              case "contains":
                _filter += "like " + (escape("%" + _val + "%"));
                break;
              case "!contains":
                _filter += "not like " + (escape("%" + _val + "%"));
                break;
              case "startsWith":
                _filter += "like " + (escape(_val + "%"));
                break;
              case "in":
                if (!_.isArray(_val)) {
                  _val = [_val];
                }
                _filter += "in ( " + (escape(_val)) + ")";
                break;
              case "sub":
                subtable = new SQLBuilder();
                subtable.table = _val.table;
                subtable.fields = _val.field;
                subtable.filter(_val.filter);
                _filter += "in ( " + (subtable.select(false)) + ")";
                break;
              case "custom":
                _filter += _val != null ? "" + _val : void 0;
            }
          }
          if ((_ref = this._c.filters) != null ? _ref.length : void 0) {
            _cbn = this._c._filterCombine ? this._c._filterCombine : this.config.standardFilterCombine;
            this._c.filters.push(_cbn);
          }
          this._c.filters.push(_filter);
          this._c._filterCombine = null;
        }
        return this;
      };

      SQLBuilder.prototype.addJoin = function(type, field, fSqlBuilder, fField, fFilters) {
        var _base;
        (_base = this._c).filters || (_base.filters = []);
        this._c.joins.push({
          type: type,
          field: field,
          table: fSqlBuilder.table,
          foreignField: fField
        });
        if ((fFilters != null) && !_.isEmpty(fFilters)) {
          this._c.filters = this._c.filters.concat(fSqlBuilder.filter(fFilters).getFilters());
        }
        return this;
      };


      /*
      		 *# or
      		
      		`sql.or()`
      		
      		Combine next filter with an `OR`
      		
      		@return { SQLBuilder } Returns itself for chaining
      		
      		@api public
       */

      SQLBuilder.prototype.or = function() {
        var _ref;
        if ((_ref = this._c.filters) != null ? _ref.length : void 0) {
          this._c._filterCombine = "OR";
        }
        return this;
      };


      /*
      		 *# and
      		
      		`sql.and()`
      		
      		Combine next filter with an `AND`
      		
      		@return { SQLBuilder } Returns itself for chaining
      		
      		@api public
       */

      SQLBuilder.prototype.and = function() {
        var _ref;
        if ((_ref = this._c.filters) != null ? _ref.length : void 0) {
          this._c._filterCombine = "AND";
        }
        return this;
      };


      /*
      		 *# filterGroup
      		
      		`sql.filterGroup( [newGroup] )`
      		
      		Start a filter group by wrapping it with "()". It will be colsed at the end, with the next group or by calling `.filterGroup( false )`
      		
      		@param { Boolean } [newGroup=true] Start a new group 
      		
      		@return { SQLBuilder } Returns itself for chaining
      		
      		@api public
       */

      SQLBuilder.prototype.filterGroup = function(newGroup) {
        var _add, _base, _ref;
        if (newGroup == null) {
          newGroup = true;
        }
        (_base = this._c).filters || (_base.filters = []);
        _add = 0;
        if ((this._c._filterGroup != null) && this._c._filterGroup >= 0) {
          this.log("debug", "filterGroup A", this._c.filters, this._c._filterGroup);
          if (this._c._filterGroup === 0) {
            this._c.filters.unshift("(");
          } else {
            this._c.filters.splice(this._c._filterGroup, 0, "(");
          }
          this._c.filters.push(")");
          _add = 1;
          this.log("debug", "filterGroup B", this._c.filters, this._c._filterGroup);
          this._c._filterGroup = null;
        }
        if (newGroup) {
          this._c._filterGroup = (((_ref = this._c.filters) != null ? _ref.length : void 0) || 0) + _add;
        }
        return this;
      };


      /*
      		 *# setToArray
      		
      		`sql.setToArray( value )`
      		
      		Convert a set value to a array
      		
      		@param { String } value A raw db set value
      		
      		@return { Array } The converted set as an array 
      		
      		@api public
       */

      SQLBuilder.prototype.setToArray = function(value) {
        var _lDlm;
        _lDlm = this.config.sqlSetDelimiter.length;
        if ((value == null) || (value != null ? value.length : void 0) <= _lDlm) {
          return null;
        }
        return value.slice(_lDlm, +(-(_lDlm + 1)) + 1 || 9e9).split(this.config.sqlSetDelimiter);
      };

      SQLBuilder.prototype.convertToType = function(key, value) {
        var _cnf, _i, _item, _key, _len, _ret, _val;
        if (_.isArray(key)) {
          _ret = [];
          for (_i = 0, _len = key.length; _i < _len; _i++) {
            _item = key[_i];
            _ret.push(this.convertToType(_item));
          }
          return _ret;
        } else if (_.isObject(key)) {
          _ret = {};
          for (_key in key) {
            _val = key[_key];
            if (__indexOf.call(this.attrKeys, _key) >= 0) {
              _ret[_key] = this.convertToType(_key, _val);
            }
          }
          return _ret;
        } else {
          if (value == null) {
            return null;
          }
          _cnf = this._getAttrConfig(key);
          if (_cnf) {
            switch (_cnf.type) {
              case "string":
              case "S":
                return value.toString();
              case "number":
              case "N":
                if (__indexOf.call(value, ".") >= 0) {
                  return parseFloat(value);
                } else {
                  return parseInt(value, 10);
                }
                break;
              case "boolean":
              case "B":
                switch (value.toString().toLowerCase()) {
                  case "true":
                  case "1":
                  case "y":
                  case "yes":
                    return true;
                  default:
                    return false;
                }
                break;
              case "json":
              case "object":
              case "J":
              case "O":
                if ((value == null) || _.isEmpty(value)) {
                  return {};
                }
                try {
                  return JSON.parse(value);
                } catch (_error) {
                  this.error("JSON parse error", value);
                  return {};
                }
                break;
              case "timestamp":
              case "T":
              case "unixtimestamp":
              case "U":
                return parseInt(value, 10);
              case "date":
              case "D":
                if (_.isDate(value)) {
                  return value;
                } else {
                  return moment(value, ["YYYY-MM-DD", "DD.MM.YYYY", "YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mmZZ"]).toDate();
                }
                break;
              case "array":
              case "A":
                return setToArray(value);
            }
          }
        }
      };

      SQLBuilder.prototype.hasField = function(field) {
        return __indexOf.call(this.attrKeys, field) >= 0;
      };


      /*
      		 *# setTable
      		
      		`sql.setTable( tbl )`
      		
      		Set the table
      		
      		@param { String } tbl Table name 
      		
      		@api private
       */

      SQLBuilder.prototype.setTable = function(tbl) {
        this._c.table = tbl;
      };


      /*
      		 *# getTable
      		
      		`sql.getTable()`
      		
      		Get the table
      		
      		@return { String } Table name 
      		
      		@api private
       */

      SQLBuilder.prototype.getTable = function() {
        if (this._c.table != null) {
          return this._c.table;
        } else {
          return this._handleError(null, "no-table");
        }
      };


      /*
      		 *# setIdField
      		
      		`sql.setIdField( field )`
      		
      		Set id field name
      		
      		@param { String } field Id field name
      		
      		@api private
       */

      SQLBuilder.prototype.setIdField = function(field) {
        this._c.idField = field;
      };


      /*
      		 *# getIdField
      		
      		`sql.getIdField()`
      		
      		Get the id field name
      		
      		@return { String } Field name 
      		
      		@api private
       */

      SQLBuilder.prototype.getIdField = function() {
        if (this._c.idField != null) {
          return this._c.idField;
        } else {
          return this._handleError(null, "no-id-field");
        }
      };


      /*
      		 *# setAttrs
      		
      		`sql.setAttrs( _attrs )`
      		
      		Set the attribute configuration
      		
      		@param { String } _attrs Arrtribute configuration 
      		
      		@api private
       */

      SQLBuilder.prototype.setAttrs = function(_attrs) {
        var attr, fldst, key, _attr, _defAttrCnf, _i, _len, _ref, _ref1;
        _defAttrCnf = this.config.attr;
        for (key in _attrs) {
          attr = _attrs[key];
          if (key != null) {
            this._c.attrKeys.push(key);
            this._c.attrNames.push(attr.name);
            _attr = this.extend({}, _defAttrCnf, attr);
            this._c.attrs.push(_attr);
            if ((_ref = attr.type) === "A" || _ref === "array") {
              this._c.attrsArrayKeys.push(key);
            }
            this._c.fieldlist.push(key);
            if (this.usefieldsets && (attr.fieldsets != null)) {
              _ref1 = attr.fieldsets;
              for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                fldst = _ref1[_i];
                if (this._c.fieldsets[fldst] == null) {
                  this._c.fieldsets[fldst] = [];
                }
                this._c.fieldsets[fldst].push(key);
              }
            }
          }
        }
      };


      /*
      		 *# getAttrs
      		
      		`sql.getAttrs()`
      		
      		Get the current attribute configuration
      		
      		@return { Object } Attribute configuration 
      		
      		@api private
       */

      SQLBuilder.prototype.getAttrs = function() {
        if (this._c.attrs != null) {
          return this._c.attrs;
        } else {
          return [];
        }
      };


      /*
      		 *# getAttrKeys
      		
      		`sql.getAttrKeys()`
      		
      		Get the keys of all defined attributes
      		
      		@return { Array } All defined attributes
      		
      		@api private
       */

      SQLBuilder.prototype.getAttrKeys = function() {
        return this._c.attrKeys || [];
      };


      /*
      		 *# getArrayAttrKeys
      		
      		`sql.getArrayAttrKeys()`
      		
      		Get all attribute keys of type `array` or `A`
      		
      		@return { Array } All defined attributes of type array 
      		
      		@api private
       */

      SQLBuilder.prototype.getArrayAttrKeys = function() {
        return this._c.attrsArrayKeys || [];
      };


      /*
      		 *# setOrderField
      		
      		`sql.setOrderField()`
      		
      		Set the order by field
      				
      		@api private
       */

      SQLBuilder.prototype.setOrderField = function(fields) {
        var fld;
        if (_.isArray(fields)) {
          return this._c.orderBy = fields;
        } else {
          return this._c.orderBy = (function() {
            var _i, _len, _ref, _results;
            _ref = fields.split(",");
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              fld = _ref[_i];
              _results.push(utils.trim(fld));
            }
            return _results;
          })();
        }
      };


      /*
      		 *# getOrderField
      		
      		`sql.getOrderField()`
      		
      		Get the defined order by field. Usualy the range key.
      		
      		@return { String } Name of the column to define the order 
      		
      		@api private
       */

      SQLBuilder.prototype.getOrderField = function() {
        if (this._c.orderBy != null) {
          return this._c.orderBy.join(", ");
        } else {
          return this;
        }
      };


      /*
      		 *# setForward
      		
      		`sql.setForward()`
      		
      		Set the order by direction
      
      		@param { String } _attrs Arrtribute configuration 
      				
      		@api private
       */

      SQLBuilder.prototype.setForward = function(dir) {
        if (_.isBoolean(dir)) {
          return this._c.forward = dir;
        } else {
          if (dir.toLowerCase() === "desc") {
            return this._c.forward = false;
          } else {
            return this._c.forward = true;
          }
        }
      };


      /*
      		 *# getForward
      		
      		`sql.getForward()`
      		
      		Get the defined order by field. Usualy the range key.
      		
      		@return { String } Name of the column to define the order 
      		
      		@api private
       */

      SQLBuilder.prototype.getForward = function() {
        if (this._c.forward != null) {
          return this._c.forward;
        } else {
          return true;
        }
      };


      /*
      		 *# getOrderBy
      		
      		`sql.getOrderBy()`
      		
      		Get the `ORDER BY` sql
      		
      		@return { String } Order by sql
      		
      		@api private
       */

      SQLBuilder.prototype.getOrderBy = function() {
        if (this.forward) {
          return "ORDER BY " + this.table + "." + this.orderfield + " ASC";
        } else {
          return "ORDER BY " + this.table + "." + this.orderfield + " DESC";
        }
      };


      /*
      		 *# getWhere
      		
      		`sql.getWhere()`
      		
      		Construct the `WHERE` sql
      		
      		@return { String } The sql Where clause
      		
      		@api private
       */

      SQLBuilder.prototype.getWhere = function(withWhere) {
        var _filters;
        if (withWhere == null) {
          withWhere = true;
        }
        _filters = this._c.filters || [];
        if (_filters.length) {
          this.filterGroup(false);
          if (withWhere) {
            return "WHERE " + (_filters.join("\n"));
          } else {
            return _filters.join("\n");
          }
        } else {
          return null;
        }
      };


      /*
      		 *# setFields
      		
      		`sql.setFields( [fields] )`
      		
      		Set the fields to select
      		
      		@param { Array|String } [fields] The fields to select as sql field list or as an array 
      		
      		@api private
       */

      SQLBuilder.prototype.setFields = function(_fields, special) {
        var setfields;
        if (_fields == null) {
          _fields = this.config.fields;
        }
        if (special == null) {
          special = false;
        }
        if (_.isFunction(_fields)) {
          setfields = _.pluck(_.filter(this.attrs, _fields), "name");
        } else if (_fields === "all" || _fields === "*") {
          setfields = this._c.fieldlist;
        } else if (_fields === "idOnly" || _fields === "idonly") {
          setfields = [this.idField];
        } else if (this.usefieldsets && _fields.slice(0, 4) === "set:" && (this._c.fieldsets[_fields.slice(4)] != null)) {
          setfields = this._c.fieldsets[_fields.slice(4)];
        } else if (_.isArray(_fields)) {
          setfields = _fields;
        } else {
          setfields = _fields.split(",");
        }
        if (!special && this._c.attrNames.length) {
          this._c.fields = _.intersection(setfields, this._c.attrNames);
        } else {
          this._c.fields = setfields;
        }
      };


      /*
      		 *# getFields
      		
      		`sql.getFields()`
      		
      		Get the field list
      		
      		@return { String } Sql field list 
      		
      		@api private
       */

      SQLBuilder.prototype.getFields = function() {
        var field, _fdls, _i, _len, _ref, _ref1;
        if ((_ref = this._c.fields) != null ? _ref.length : void 0) {
          _fdls = [];
          _ref1 = this._c.fields;
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            field = _ref1[_i];
            if (field.indexOf(" ") < 0) {
              _fdls.push("" + this.table + "." + field);
            } else {
              _fdls.push(field);
            }
          }
          return _fdls.join(", ");
        } else {
          return "*";
        }
      };


      /*
      		 *# getFieldNames
      		
      		`sql.getFieldNames()`
      		
      		Get a list of fieldnames
      		
      		@return { String[] } Sql field list 
      		
      		@api private
       */

      SQLBuilder.prototype.getFieldNames = function() {
        var _ref;
        if ((_ref = this._c.fields) != null ? _ref.length : void 0) {
          return _.clone(this._c.fields);
        } else {
          return [];
        }
      };


      /*
      		 *# setUseFieldsets
      		
      		`sql.setUseFieldsets( tbl )`
      		
      		Use the Fieldset feature
      		
      		@param { String } tbl UseFieldsets name 
      		
      		@api private
       */

      SQLBuilder.prototype.setUseFieldsets = function(use) {
        this._c.usefieldsets = use || false;
      };


      /*
      		 *# getUseFieldsets
      		
      		`sql.getUseFieldsets()`
      		
      		Get the table
      		
      		@return { String } UseFieldsets name 
      		
      		@api private
       */

      SQLBuilder.prototype.getUseFieldsets = function() {
        if (this._c.usefieldsets != null) {
          return this._c.usefieldsets;
        } else {
          return false;
        }
      };


      /*
      		 *# setLimit
      		
      		`sql.setLimit( [_limit] )`
      		
      		Set the maximum number of returned values
      		
      		@param { Number } [_limit] The number of returned elements. `0` for unlimited
      		
      		@api private
       */

      SQLBuilder.prototype.setLimit = function(_limit) {
        if (_limit == null) {
          _limit = this.config.limit;
        }
        this._c.limit = _limit;
      };


      /*
      		 *# getLimit
      		
      		`sql.getLimit()`
      		
      		Get the `LIMIT` sql
      		
      		@return { String } The sql limit clause
      		
      		@api private
       */

      SQLBuilder.prototype.getLimit = function() {
        if (this._c.limit != null) {
          if (this._c.limit === 0) {
            return null;
          } else {
            return "LIMIT " + this._c.limit;
          }
        } else {
          return "LIMIT " + this.config.limit;
        }
      };


      /*
      		 *# setDefaultLimit
      		
      		`sql.setDefaultLimit( [_limit] )`
      		
      		Set the default maximum number of returned values
      		
      		@param { Number } [_limit] The number of returned elements. `0` for unlimited
      		
      		@api private
       */

      SQLBuilder.prototype.setDefaultLimit = function(_limit) {
        if (_limit == null) {
          _limit = this.config.limit;
        }
        this.config.limit = _limit;
      };


      /*
      		 *# getDefaultLimit
      		
      		`sql.getDefaultLimit()`
      		
      		Get the default `LIMIT` sql
      		
      		@return { String } The sql limit clause
      		
      		@api private
       */

      SQLBuilder.prototype.getDefaultLimit = function() {
        return this.config.limit;
      };


      /*
      		 *# hasFilter
      		
      		`sql.hasFilter( id, cb )`
      		
      		Check if a filter is activated
      		
      		@return { Boolean } Is filtered 
      		
      		@api private
       */

      SQLBuilder.prototype.hasFilter = function() {
        return this._c.filters.length > 0;
      };

      SQLBuilder.prototype.getFilters = function() {
        return this._c.filters;
      };

      SQLBuilder.prototype.hasJoins = function() {
        return this._c.joins.length > 0;
      };

      SQLBuilder.prototype.getJoins = function() {
        var _i, _jn, _joins, _len, _ref;
        _joins = [];
        _ref = this._c.joins;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          _jn = _ref[_i];
          _joins.push("" + (_jn.type.toUpperCase()) + " JOIN " + _jn.table + " ON " + this.table + "." + _jn.field + " = " + _jn.table + "." + _jn.foreignField);
        }
        return _joins.join("\n");
      };


      /*
      		 *# _validateAttributes
      		
      		`sql._validateAttributes( isCreate, attributes )`
      		
      		Validate the attributes before a update or insert
      		
      		@param { Boolean } isCreate It is a insert 
      		@param { Object } attributes Object of attributes to save 
      		
      		@return { Object } The cleaned attributes 
      		
      		@api private
       */

      SQLBuilder.prototype._validateAttributes = function(isCreate, attrs) {
        var _keys, _omited;
        _keys = this.attrKeys;
        _omited = _.difference(Object.keys(attrs), _keys);
        attrs = _.pick(attrs, _keys);
        if (_omited.length) {
          this.info("validateAttributes", "You tried to save a attribute not defined in the model config of `" + this.table + "`", _omited);
        } else {
          this.debug("validateAttributes", attrs);
        }
        return attrs;
      };


      /*
      		 *# _getAttrConfig
      		
      		`sql._getAttrConfig( key )`
      		
      		Get the configuration of a attribute
      		
      		@param { String } key Attribute/Column/Field name 
      		
      		@return { Object } Attribute configuration
      		
      		@api private
       */

      SQLBuilder.prototype._getAttrConfig = function(name) {
        var attr, _i, _len, _ref;
        _ref = this.attrs;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attr = _ref[_i];
          if (attr.name === name) {
            return attr;
          }
        }
        return null;
      };


      /*
      		 *# _getSaveVariables
      		
      		`sql._getSaveVariables( attributes )`
      		
      		Create the keys and values for the update and inser statements
      		
      		@param { Object } attributes Data object to save 
      		
      		@return { [_keys,_vals] } `_keys`: An array of all keys to save; `_vals`: An array of all escaped values to save
      		
      		@api private
       */

      SQLBuilder.prototype._getSaveVariables = function(attributes, isInsert) {
        var _cnf, _count, _d, _key, _keys, _m, _operand, _ref, _setval, _val, _vals;
        if (isInsert == null) {
          isInsert = false;
        }
        _keys = [];
        _vals = [];
        for (_key in attributes) {
          _val = attributes[_key];
          _cnf = this._getAttrConfig(_key);
          if (_cnf) {
            switch (_cnf.type) {
              case "string":
              case "S":
                if ((_val != null) && !_.isString(_val)) {
                  _val = _val.toString();
                }
                if (_val == null) {
                  _vals.push("NULL");
                } else if ((_val != null ? _val.slice(0, 3) : void 0) === "IF(") {
                  _vals.push(_val);
                } else {
                  _vals.push(escape(_val));
                }
                _keys.push(_key);
                break;
              case "number":
              case "N":
                if (_val == null) {
                  _vals.push("NULL");
                } else if (_.isString(_val) && (_val != null ? _val.slice(0, 3) : void 0) === "IF(") {
                  _vals.push(_val);
                } else if (_val === "now") {
                  _vals.push("UNIX_TIMESTAMP()*1000");
                } else if (_val === "incr") {
                  _vals.push("IF( " + _key + " is NULL, 0, " + _key + " + 1 )");
                } else if (_val === "decr") {
                  _vals.push("IF( " + _key + " is NULL, 0, " + _key + " - 1 )");
                } else if (_.isString(_val) && (_val != null ? _val.slice(0, 4) : void 0) === "crmt") {
                  _count = parseInt(_val.slice(4), 10);
                  _operand = "+";
                  if (isNaN(_count)) {
                    _count = 1;
                  }
                  if (_count < 0) {
                    _operand = "-";
                    _count = _count * -1;
                  }
                  _vals.push("IF( " + _key + " is NULL, " + (_operand === "+" ? 1 : 0) + ", " + _key + " " + _operand + " " + _count + " )");
                } else {
                  _vals.push(escape(parseFloat(_val)));
                }
                _keys.push(_key);
                break;
              case "boolean":
              case "B":
                switch (_val.toString().toLowerCase()) {
                  case "true":
                  case "1":
                  case "y":
                  case "yes":
                    _vals.push(true);
                    break;
                  default:
                    _vals.push(false);
                }
                _keys.push(_key);
                break;
              case "json":
              case "object":
              case "J":
              case "O":
                if (_val == null) {
                  _vals.push(escape("{}"));
                } else {
                  try {
                    _vals.push(escape(JSON.stringify(_val)));
                  } catch (_error) {}
                }
                _keys.push(_key);
                break;
              case "timestamp":
              case "T":
                if (_val === "now") {
                  _vals.push("UNIX_TIMESTAMP()*1000");
                } else if (_.isDate(_val)) {
                  _vals.push(Math.round(_val.getTime()));
                } else if (_.isString(_val)) {
                  _d = moment(_val, _cnf.dateFormat || ["YYYY-MM-DD", "DD.MM.YYYY", "YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mmZZ"]);
                  _vals.push(_d.valueOf());
                } else if (_.isNumber(_val)) {
                  if (_val.toString().length === 10) {
                    _vals.push(Math.round(_val * 1000));
                  } else {
                    _vals.push(escape(_val));
                  }
                } else {
                  _vals.push(escape(_val));
                }
                _keys.push(_key);
                break;
              case "unixtimestamp":
              case "U":
                if (_val === "now") {
                  _vals.push("UNIX_TIMESTAMP()");
                } else if (_.isDate(_val)) {
                  _vals.push(Math.round(_val.getTime() / 1000));
                } else if (_.isString(_val)) {
                  _d = moment(_val, _cnf.dateFormat || ["YYYY-MM-DD", "DD.MM.YYYY", "YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mmZZ"]);
                  _vals.push(_d.unix());
                } else if (_.isNumber(_val)) {
                  if (_val.toString().length === 13) {
                    _vals.push(Math.round(_val / 1000));
                  } else {
                    _vals.push(escape(_val));
                  }
                } else {
                  _vals.push(escape(_val));
                }
                _keys.push(_key);
                break;
              case "date":
              case "D":
                if (_val === "now") {
                  _val = new Date();
                }
                if (_.isDate(_val)) {
                  _vals.push(escape(_val));
                  _keys.push(_key);
                } else if (_.isDate((_ref = (_m = moment(_val, ["YYYY-MM-DD", "DD.MM.YYYY", "YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mmZZ"]))) != null ? _ref._d : void 0)) {
                  _vals.push(escape(_m.format("YYYY-MM-DD HH:mm")));
                  _keys.push(_key);
                }
                break;
              case "array":
              case "A":
                _setval = this._generateSetCommand(_key, _val, this.config.sqlSetDelimiter);
                if (_setval != null) {
                  _vals.push(_setval);
                  _keys.push(_key);
                }
                this.log("debug", "setCommand", _setval, _val, _key);
            }
          }
        }
        return [_keys, _vals];
        return null;
      };

      SQLBuilder.prototype._generateSetCommandTmpls = {
        add: _.template('IF( INSTR( <%= set %>,"<%= val %><%= dlm %>") = 0, "<%= val %><%= dlm %>", "" )'),
        rem: _.template('REPLACE( <%= set %>, "<%= dlm %><%= val %><%= dlm %>", "<%= dlm %>")'),
        set: _.template('IF( <%= key %> is NULL,"<%= dlm %>", <%= key %>)')
      };


      /*
      		 *# _generateSetCommand
      		
      		`sql._generateSetCommand( key, inp, dlm )`
      		
      		Generate the sql command to add, reset or remove a elment out of a set string.
      		How to handle set within a sql field is described by this [GIST](https://gist.github.com/mpneuried/5704200) 
      		
      		@param { String } key The field name 
      		@param { String|Number|Object } inp the set command as simple string/number or complex set command. More in [API docs](http://mpneuried.github.io/mysql-dynamo/) section " Working with sets"
      		@param { String } dlm The delimiter within the field
      
      		@return { String } Return Desc 
      		
      		@api private
       */

      SQLBuilder.prototype._generateSetCommand = function(key, inp, dlm) {
        var added, usedRem, _add, _i, _inp, _j, _len, _len1, _ref, _ref1, _set;
        this.log("debug", "_generateSetCommand", key, inp);
        if (inp == null) {
          return escape(dlm);
        } else if (_.isArray(inp)) {
          if (!inp.length) {
            return escape(dlm);
          } else {
            return escape(dlm + inp.join(dlm) + dlm);
          }
        } else if (_.isObject(inp)) {
          if (inp["$reset"]) {
            if (_.isArray(inp["$reset"])) {
              return escape(dlm + inp["$reset"].join(dlm) + dlm);
            } else {
              return escape(dlm + inp["$reset"] + dlm);
            }
          } else {
            added = [];
            usedRem = false;
            _set = this._generateSetCommandTmpls.set({
              key: key,
              dlm: dlm
            });
            _add = [_set];
            if (inp["$add"] != null) {
              if (_.isArray(inp["$add"])) {
                _ref = _.uniq(inp["$add"]);
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                  _inp = _ref[_i];
                  added.push(_inp);
                  _add.push(this._generateSetCommandTmpls.add({
                    val: _inp,
                    set: _set,
                    dlm: dlm
                  }));
                }
              } else {
                added.push(inp["$add"]);
                _add.push(this._generateSetCommandTmpls.add({
                  val: inp["$add"],
                  set: _set,
                  dlm: dlm
                }));
              }
              if (_add.length) {
                _set = "CONCAT( " + (_add.join(", ")) + " )";
              }
            }
            if (inp["$rem"] != null) {
              if (_.isArray(inp["$rem"])) {
                _ref1 = _.difference(_.uniq(inp["$rem"]), added);
                for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
                  _inp = _ref1[_j];
                  usedRem = true;
                  _set = this._generateSetCommandTmpls.rem({
                    val: _inp,
                    set: _set,
                    dlm: dlm
                  });
                }
              } else {
                usedRem = true;
                _set = this._generateSetCommandTmpls.rem({
                  val: inp["$rem"],
                  set: _set,
                  dlm: dlm
                });
              }
            }
            if (added.length || usedRem) {
              return _set;
            } else {
              return null;
            }
          }
        } else if (inp != null) {
          return escape(dlm + inp + dlm);
        } else {
          return null;
        }
      };

      SQLBuilder.prototype.ERRORS = function() {
        return this.extend(SQLBuilder.__super__.ERRORS.apply(this, arguments), {
          "no-tables": "No table defined",
          "no-id-field": "No id field defined"
        });
      };

      return SQLBuilder;

    })(require("./basic"));
  };

}).call(this);
