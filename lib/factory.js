(function() {
  var MySQLFactory, Table, _, mysql, utils,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  _ = require('lodash')._;

  mysql = require('mysql');

  Table = require("./table");

  utils = require("./utils");

  module.exports = MySQLFactory = (function(superClass) {
    extend(MySQLFactory, superClass);

    MySQLFactory.prototype.defaults = function() {
      return this.extend(MySQLFactory.__super__.defaults.apply(this, arguments), {
        showQueryTime: false,
        host: 'localhost',
        user: 'root',
        password: 'secret',
        database: "your-database",
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: "local"
      });
    };


    /*	
    	## constructor 
    
    	`new MySQLFactory( options, tableSettings )`
    	
    	Define the configuration by options and defaults, and save the table settings.
    
    	@param {Object} options Basic config object
    	@param {Object} tableSettings Configuration of all tabels. For details see the [API docs](http://mpneuried.github.io/mysql-dynamo/)
     */

    function MySQLFactory(options, tableSettings) {
      this.tableSettings = tableSettings;
      this.ERRORS = bind(this.ERRORS, this);
      this._initTables = bind(this._initTables, this);
      this.escape = bind(this.escape, this);
      this.has = bind(this.has, this);
      this.get = bind(this.get, this);
      this.each = bind(this.each, this);
      this.list = bind(this.list, this);
      this.exec = bind(this.exec, this);
      this.initialize = bind(this.initialize, this);
      this.defaults = bind(this.defaults, this);
      MySQLFactory.__super__.constructor.apply(this, arguments);
    }


    /*
    	## initialize
    	
    	`factory.initialize()`
    	
    	Initialize the MySQL pool
    
    	@api private
     */

    MySQLFactory.prototype.initialize = function() {
      this.pool = mysql.createPool(this.extend({}, this.config, {
        multipleStatements: true
      }));
      this.connected = false;
      this._dbTables = {};
      this._tables = {};
      this.log("debug", "initialized");
      this._initTables();
    };


    /*
    	## exec
    	
    	`factory.exec( statement[, args], cb )`
    	
    	Run a sql query by using a connection from the pool
    	
    	@param { String|Array } statement A MySQL SQL statement or an array of multiple statements
    	@param { Array|Object } [args] Query arguments to auto escape. The arguments will directly passed to the `mysql.query()` method from [node-mysql](https://github.com/felixge/node-mysql#escaping-query-values)
    	@param { Function } cb Callback function 
    	
    	@api public
     */

    MySQLFactory.prototype.exec = function() {
      var _now, args, cb, i;
      if (this.config.showQueryTime) {
        _now = Date.now();
      }
      args = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), cb = arguments[i++];
      this.debug("run query", args);
      if (_.isArray(args[0])) {
        args[0] = args[0].join(";\n");
      }
      this.pool.getConnection((function(_this) {
        return function(err, conn) {
          if (err) {
            cb(err);
            return;
          }
          args.push(function() {
            conn.release();
            if (_this.config.showQueryTime) {
              _this.info("query time " + (Date.now() - _now) + "ms");
            }
            cb.apply(_this, arguments);
          });
          conn.query.apply(conn, args);
        };
      })(this));
    };


    /*
    	## list
    	
    	`factory.list( cb )`
    	
    	List all existing db tables
    	
    	@param { Function } cb Callback function 
    	
    	@api public
     */

    MySQLFactory.prototype.list = function(cb) {
      cb(null, Object.keys(this._tables));
    };


    /*
    	## each
    	
    	`factory.each( fn )`
    	
    	Loop troug all tables
    	
    	@param { Function } fn Method called for every table. Looks like `.each ( key, tableObj )=>`
    	
    	@api public
     */

    MySQLFactory.prototype.each = function(fn) {
      var _tbl, _tblKey, ref;
      ref = this._tables;
      for (_tblKey in ref) {
        _tbl = ref[_tblKey];
        fn(_tblKey, _tbl);
      }
    };


    /*
    	## get
    	
    	`factory.get( tableName )`
    	
    	Get a [Table](table.coffee.html) by name
    	
    	@param { String } tableName Table name to get 
    	
    	@return { Table } The found [Table](table.coffee.html) object or `null` 
    	
    	@api public
     */

    MySQLFactory.prototype.get = function(tableName) {
      if (this.has(tableName)) {
        return this._tables[tableName];
      } else {
        return null;
      }
    };


    /*
    	## has
    	
    	`factory.has( tableName )`
    	
    	Check for a defined table
    	
    	@param { String } tableName Table name 
    	
    	@return { Boolean } Table exists 
    	
    	@api public
     */

    MySQLFactory.prototype.has = function(tableName) {
      return this._tables[tableName] != null;
    };

    MySQLFactory.prototype.escape = function(val) {
      return this.pool.escape(val);
    };


    /*
    	## _initTables
    	
    	`factory._initTables( tables, cb )`
    	
    	Initialize the [Table](table.coffee.html) objects defined within the table configuration
    	
    	@param { Object } [tables=@tableSettings] The Table settings. If `null` it uses the configured tables 
    	
    	@api private
     */

    MySQLFactory.prototype._initTables = function(tables) {
      var _opt, _tblObj, event, events, fn, i, len, ref, ref1, table, tableName;
      if (tables == null) {
        tables = this.tableSettings;
      }
      for (tableName in tables) {
        table = tables[tableName];
        if (this._tables[tableName] != null) {
          delete this._tables[tableName];
        }
        _opt = {
          factory: this,
          logging: this.config.logging,
          returnFormat: this.config.returnFormat
        };
        _tblObj = new Table(_.omit(table, "events"), _opt);
        ref = table.events;
        for (events in ref) {
          fn = ref[events];
          ref1 = events.split(',');
          for (i = 0, len = ref1.length; i < len; i++) {
            event = ref1[i];
            _tblObj.on(event, _.bind(fn, _tblObj, event));
          }
        }
        this._tables[tableName] = _tblObj;
        this.emit("tableinit", tableName, _tblObj);
        this.debug("tableinit", tableName);
      }
      this.connected = true;
    };

    MySQLFactory.prototype.ERRORS = function() {
      return this.extend(MySQLFactory.__super__.ERRORS.apply(this, arguments), {
        "no-tables-fetched": "Currently not tables fetched. Please run `factory.connect()` first.",
        "table-not-found": "Table `<%= tableName %>` not found."
      });
    };

    return MySQLFactory;

  })(require("./basic"));

}).call(this);
