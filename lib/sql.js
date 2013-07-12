(function() {
  var mysql, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  mysql = require('mysql');

  utils = require('./utils');

  _ = require('lodash')._;

  module.exports = function(options) {
    var SQLBuilder;
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
      		## constructor 
      
      		`new SQLBuilder( _c )`
      		
      		A SQL Builder instance to generate SQL statements
      
      		@param {Object} _c Basic internal config data. Used to clone a Instance
      */


      function SQLBuilder(_c) {
        var _base, _base1, _base2, _base3, _base4, _base5;
        this._c = _c != null ? _c : {};
        this.ERRORS = __bind(this.ERRORS, this);
        this._generateSetCommand = __bind(this._generateSetCommand, this);
        this._getSaveVariables = __bind(this._getSaveVariables, this);
        this._getAttrConfig = __bind(this._getAttrConfig, this);
        this._validateAttributes = __bind(this._validateAttributes, this);
        this.getLimit = __bind(this.getLimit, this);
        this.setLimit = __bind(this.setLimit, this);
        this.getUseFieldsets = __bind(this.getUseFieldsets, this);
        this.setUseFieldsets = __bind(this.setUseFieldsets, this);
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
        this.setToArray = __bind(this.setToArray, this);
        this.filterGroup = __bind(this.filterGroup, this);
        this.and = __bind(this.and, this);
        this.or = __bind(this.or, this);
        this.filter = __bind(this.filter, this);
        this.del = __bind(this.del, this);
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
        SQLBuilder.__super__.constructor.call(this, options);
        return;
      }

      /*
      		## initialize
      		
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
        this.define("usefieldsets", this.getUseFieldsets, this.setUseFieldsets);
        this.define("limit", this.getLimit, this.setLimit);
        this.getter("orderby", this.getOrderBy);
        this.define("orderfield", this.getOrderField, this.setOrderField);
        this.define("forward", this.getForward, this.setForward);
        this.getter("where", this.getWhere);
        this.log("debug", "initialized");
      };

      /*
      		## clone
      		
      		`sql.clone()`
      		
      		Clone the current state of the SQLBuilder
      		
      		@return { SQLBuilder } The cloned Instance
      		
      		@api public
      */


      SQLBuilder.prototype.clone = function() {
        this.log("debug", "run clone");
        return new SQLBuilder(_.clone(this._c));
      };

      /*
      		## insert
      		
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
        _ref = this._getSaveVariables(attributes), _keys = _ref[0], _vals = _ref[1];
        statement.push("( " + (_keys.join(", ")) + " )");
        statement.push("VALUES ( " + (_vals.join(", ")) + " )");
        return _.compact(statement).join("\n");
      };

      /*
      		## update
      		
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
        _ref = this._getSaveVariables(attributes), _keys = _ref[0], _vals = _ref[1];
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
      		## select
      		
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
        statement.push(this.where);
        if (complex) {
          statement.push(this.orderby);
          statement.push(this.limit);
        }
        return _.compact(statement).join("\n");
      };

      /*
      		## delete
      		
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
      		## filter
      		
      		`sql.filter( key, pred )`
      		
      		Define a filter criteria which will be used by the `.getWhere()` method
      		
      		@param { String|Object } key The filter key or a Object of key and predicate 
      		@param { Object|String|Number } pred A prediucate object. For details see [Jed's Predicates ](https://github.com/jed/dynamo/wiki/High-level-API#wiki-predicates)
      		
      		@return { SQLBuilder } Returns itself for chaining
      		
      		@api public
      */


      SQLBuilder.prototype.filter = function(key, pred) {
        var _base, _cbn, _filter, _k, _operand, _pred, _ref, _val;
        (_base = this._c).filters || (_base.filters = []);
        this.log("debug", "filter", key, pred);
        if (_.isObject(key)) {
          for (_k in key) {
            _pred = key[_k];
            this.filter(_k, _pred);
          }
        } else {
          _filter = "" + key + " ";
          if (pred == null) {
            _filter += "is NULL";
          } else if (_.isString(pred) || _.isNumber(pred)) {
            _filter += "= " + (mysql.escape(pred));
          } else if (_.isArray(pred)) {
            _filter += "in ( " + (mysql.escape(pred)) + ")";
          } else {
            _operand = Object.keys(pred)[0];
            _val = pred[_operand];
            switch (_operand) {
              case "==":
                _filter += _val != null ? "= " + (mysql.escape(_val)) : "is NULL";
                break;
              case "!=":
                _filter += _val != null ? "!= " + (mysql.escape(_val)) : "is not NULL";
                break;
              case ">":
              case "<":
              case "<=":
              case ">=":
                if (_.isArray(_val)) {
                  _filter += "between " + (mysql.escape(_val[0])) + " and " + (mysql.escape(_val[1]));
                } else {
                  _filter += "" + _operand + " " + (mysql.escape(_val));
                }
                break;
              case "contains":
                _filter += "like '" + (mysql.escape("%" + _val + "%")) + "'";
                break;
              case "!contains":
                _filter += "not like '" + (mysql.escape("%" + _val + "%")) + "'";
                break;
              case "startsWith":
                _filter += "like '" + (mysql.escape(_val + "%")) + "'";
                break;
              case "in":
                if (!_.isArray(_val)) {
                  _val = [_val];
                }
                _filter += "in ( " + (mysql.escape(_val)) + ")";
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

      /*
      		## or
      		
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
      		## and
      		
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
      		## filterGroup
      		
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
      		## setToArray
      		
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

      /*
      		## setTable
      		
      		`sql.setTable( tbl )`
      		
      		Set the table
      		
      		@param { String } tbl Table name 
      		
      		@api private
      */


      SQLBuilder.prototype.setTable = function(tbl) {
        this._c.table = tbl;
      };

      /*
      		## getTable
      		
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
      		## setIdField
      		
      		`sql.setIdField( field )`
      		
      		Set id field name
      		
      		@param { String } field Id field name
      		
      		@api private
      */


      SQLBuilder.prototype.setIdField = function(field) {
        this._c.idField = field;
      };

      /*
      		## getIdField
      		
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
      		## setAttrs
      		
      		`sql.setAttrs( _attrs )`
      		
      		Set the attribute configuration
      		
      		@param { String } _attrs Arrtribute configuration 
      		
      		@api private
      */


      SQLBuilder.prototype.setAttrs = function(_attrs) {
        var attr, fldst, key, _defAttrCnf, _i, _len, _ref, _ref1;
        _defAttrCnf = this.config.attr;
        for (key in _attrs) {
          attr = _attrs[key];
          if (key != null) {
            this._c.attrKeys.push(key);
            this._c.attrNames.push(attr.name);
            this._c.attrs.push(this.extend({}, _defAttrCnf, attr));
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
      		## getAttrs
      		
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
      		## getAttrKeys
      		
      		`sql.getAttrKeys()`
      		
      		Get the keys of all defined attributes
      		
      		@return { Array } All defined attributes
      		
      		@api private
      */


      SQLBuilder.prototype.getAttrKeys = function() {
        return this._c.attrKeys || [];
      };

      /*
      		## getArrayAttrKeys
      		
      		`sql.getArrayAttrKeys()`
      		
      		Get all attribute keys of type `array` or `A`
      		
      		@return { Array } All defined attributes of type array 
      		
      		@api private
      */


      SQLBuilder.prototype.getArrayAttrKeys = function() {
        return this._c.attrsArrayKeys || [];
      };

      /*
      		## setOrderField
      		
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
      		## getOrderField
      		
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
      		## setForward
      		
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
      		## getForward
      		
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
      		## getOrderBy
      		
      		`sql.getOrderBy()`
      		
      		Get the `ORDER BY` sql
      		
      		@return { String } Order by sql
      		
      		@api private
      */


      SQLBuilder.prototype.getOrderBy = function() {
        if (this.forward) {
          return "ORDER BY " + this.orderfield + " ASC";
        } else {
          return "ORDER BY " + this.orderfield + " DESC";
        }
      };

      /*
      		## getWhere
      		
      		`sql.getWhere()`
      		
      		Construct the `WHERE` sql
      		
      		@return { String } The sql Where clause
      		
      		@api private
      */


      SQLBuilder.prototype.getWhere = function() {
        var _filters;
        _filters = this._c.filters || [];
        if (_filters.length) {
          this.filterGroup(false);
          return "WHERE " + (_filters.join("\n"));
        } else {
          return null;
        }
      };

      /*
      		## setFields
      		
      		`sql.setFields( [fields] )`
      		
      		Set the fields to select
      		
      		@param { Array|String } [fields] The fields to select as sql field list or as an array 
      		
      		@api private
      */


      SQLBuilder.prototype.setFields = function(_fields) {
        if (_fields == null) {
          _fields = this.config.fields;
        }
        if (_.isFunction(_fields)) {
          this._c.fields = _.pluck(_.filter(this.attrs, _fields), "name");
        } else if (_fields === "all" || _fields === "*") {
          this._c.fields = this._c.fieldlist;
        } else if (_fields === "idOnly" || _fields === "idonly") {
          this._c.fields = [this.idField];
        } else if (this.usefieldsets && _fields.slice(0, 4) === "set:" && (this._c.fieldsets[_fields.slice(4)] != null)) {
          this._c.fields = this._c.fieldsets[_fields.slice(4)];
        } else if (_.isArray(_fields)) {
          this._c.fields = _fields;
        } else {
          this._c.fields = _fields.split(",");
        }
      };

      /*
      		## getFields
      		
      		`sql.getFields()`
      		
      		Get the field list
      		
      		@return { String } Sql field list 
      		
      		@api private
      */


      SQLBuilder.prototype.getFields = function() {
        var _ref;
        if ((_ref = this._c.fields) != null ? _ref.length : void 0) {
          return this._c.fields.join(", ");
        } else {
          return "*";
        }
      };

      /*
      		## setUseFieldsets
      		
      		`sql.setUseFieldsets( tbl )`
      		
      		Use the Fieldset feature
      		
      		@param { String } tbl UseFieldsets name 
      		
      		@api private
      */


      SQLBuilder.prototype.setUseFieldsets = function(use) {
        this._c.usefieldsets = use || false;
      };

      /*
      		## getUseFieldsets
      		
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
      		## setLimit
      		
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
      		## getLimit
      		
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
      		## _validateAttributes
      		
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
          this.log("warning", "validateAttributes", "You tried to save to attributed not defined in the model config", _omited, attrs);
        } else {
          this.log("debug", "validateAttributes", attrs);
        }
        return attrs;
      };

      /*
      		## _getAttrConfig
      		
      		`sql._getAttrConfig( key )`
      		
      		Get the configuration of a attribute
      		
      		@param { String } key Attribute/Column/Field name 
      		
      		@return { Object } Attribute configuration
      		
      		@api private
      */


      SQLBuilder.prototype._getAttrConfig = function(key) {
        var attr, _i, _len, _ref;
        _ref = this.attrs;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          attr = _ref[_i];
          if (attr.key === key) {
            return attr;
          }
        }
      };

      /*
      		## _getSaveVariables
      		
      		`sql._getSaveVariables( attributes )`
      		
      		Create the keys and values for the update and inser statements
      		
      		@param { Object } attributes Data object to save 
      		
      		@return { [_keys,_vals] } `_keys`: An array of all keys to save; `_vals`: An array of all escaped values to save
      		
      		@api private
      */


      SQLBuilder.prototype._getSaveVariables = function(attributes) {
        var _cnf, _key, _keys, _m, _setval, _val, _vals;
        _keys = [];
        _vals = [];
        for (_key in attributes) {
          _val = attributes[_key];
          _cnf = this._getAttrConfig(_key);
          if (_cnf) {
            switch (_cnf.type) {
              case "string":
              case "number":
              case "S":
              case "N":
                _vals.push(mysql.escape(_val));
                _keys.push(_key);
                break;
              case "boolean":
              case "B":
                try {
                  _vals.push(mysql.escape(JSON.stringify(_val)));
                  _keys.push(_key);
                } catch (_error) {}
                break;
              case "json":
              case "object":
              case "J":
              case "O":
                try {
                  _vals.push(mysql.escape(JSON.stringify(_val)));
                  _keys.push(_key);
                } catch (_error) {}
                break;
              case "timestamp":
              case "T":
                if (_val === "now") {
                  _vals.push("UNIX_TIMESTAMP()*1000");
                } else {
                  _vals.push(mysql.escape(_val));
                }
                _keys.push(_key);
                break;
              case "date":
              case "D":
                if (_.isDate(value)) {
                  _vals.push(mysql.escape(value.toISOString()));
                  _keys.push(_key);
                } else if (_.isDate((_m = moment(value, ["YYYY-MM-DD", "DD.MM.YYYY", "YYYY-MM-DD HH:mm"]))._d)) {
                  _vals.push(mysql.escape(_m.format("YYYY-MM-DD HH:mm")));
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
      		## _generateSetCommand
      		
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
          return mysql.escape(dlm);
        } else if (_.isArray(inp)) {
          if (!inp.length) {
            return mysql.escape(dlm);
          } else {
            return mysql.escape(dlm + inp.join(dlm) + dlm);
          }
        } else if (_.isObject(inp)) {
          if (inp["$reset"]) {
            if (_.isArray(inp["$reset"])) {
              return mysql.escape(dlm + inp["$reset"].join(dlm) + dlm);
            } else {
              return mysql.escape(dlm + inp["$reset"] + dlm);
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
          return mysql.escape(dlm + inp + dlm);
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
