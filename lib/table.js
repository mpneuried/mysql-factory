(function() {
  var MySQLTable, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require('lodash')._;

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
      this._getOptions = __bind(this._getOptions, this);
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
      this.builder.fields = "*";
      this.builder.orderfield = this.sortfield;
      this.builder.attrs = this.settings.fields;
      this.builder.forward = this.sortdirection;
      this.debug("attrs", this.builder.attrs);
    };

    MySQLTable.prototype.get = function(id, cb, opt) {
      var options, sql,
        _this = this;
      options = this._getOptions(options, "get");
      sql = this.builder.clone();
      if (options.fields != null) {
        sql.fields = options.fields;
      }
      sql.filter(this.sIdField, id);
      this.factory.sql(sql.select(false), function(err, results) {});
    };

    MySQLTable.prototype._getOptions = function(options) {};

    return MySQLTable;

  })(require("./basic"));

}).call(this);
