(function() {
  var AuthenticationFailed, DBConnector, EventEmitter, SetupFailed, sys, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  sys = require("sys");

  EventEmitter = require("events").EventEmitter;

  _ = require('lodash')._;

  DBConnector = (function(_super) {
    __extends(DBConnector, _super);

    function DBConnector(settings) {
      this.query = __bind(this.query, this);
      var mySQLClient, _ref;
      this.user = settings.user || null;
      this.password = settings.password || null;
      this.host = settings.host || "localhost";
      this.port = settings.port || "3306";
      this.database = settings.database || null;
      this.disconnectAfterQuery = false;
      this.logLevel = 0;
      this.type = (_ref = settings.type) != null ? _ref : "mysql";
      this.runningQuerys = 0;
      this.runningConnections = 0;
      switch (this.type) {
        case "mysql":
          mySQLClient = require("../mysql-old/").Client;
          this["native"] = new mySQLClient();
          this._setupConnection();
          break;
        default:
          this["native"] = false;
      }
      this.isConnected = false;
      this.isConnecting = false;
      this.queue = [];
      return;
    }

    DBConnector.prototype.connect = function(callback) {
      var _this = this;
      if (this["native"]) {
        if (!this.isConnected) {
          this._log(2, "connect:start", this["native"]);
          this.isConnecting = true;
          ++this.runningConnections;
          this["native"].connect(function(err, results) {
            if (err) {
              _this._log(1, "connect", err);
              throw err;
            }
            _this._connectDatabase(callback);
            _this._log(2, "connect:done");
          });
        } else {
          this._log(2, "connect:allready-connected", err);
          if (callback) {
            callback();
          }
          this.emit("connected", false);
        }
      } else {
        throw new SetupFailed("nativ connector ist not initialized");
      }
    };

    DBConnector.prototype.disconnect = function() {
      if (this.runningQuerys === 0) {
        --this.runningConnections;
        this["native"].end();
        this.isConnected = false;
        this._log(2, "disconnect:done");
      }
    };

    DBConnector.prototype.query = function(statement, aArgs, callback) {
      if (this.isConnected) {
        ++this.runningQuerys;
        this._log(2, "query:start:stmt", this._prepareStatement(statement));
        this._log(2, "query:start:args", this._prepareQueryArgs(aArgs));
        this["native"].query(this._prepareStatement(statement), this._prepareQueryArgs(aArgs), _.bind(this._queryCallback, this, callback));
        this._log(2, "query:done");
      } else if (this.isConnecting) {
        this._addToQueue(this.query, arguments, this);
      } else {
        this.connect(_.bind(this.query, this, statement, aArgs, callback));
      }
    };

    DBConnector.prototype.isConnected = function() {
      return this.isConnected;
    };

    DBConnector.prototype._queryCallback = function(callback, err, results, meta) {
      this._log(2, "query-result", results.length);
      if (err) {
        this._log(1, "query-result", err);
      }
      if (arguments.length <= 3) {
        meta = results;
        results = null;
      }
      if (_.isFunction(callback)) {
        callback(err, results, meta);
      } else if (_.isString(callback)) {
        this.emit(err, callback, results, meta);
      } else {
        this.emit("success", results, meta);
      }
      --this.runningQuerys;
      if (this.disconnectAfterQuery) {
        this.disconnect();
      }
    };

    DBConnector.prototype._prepareStatement = function(statement) {
      return statement;
    };

    DBConnector.prototype._prepareQueryArgs = function(aArgs) {
      return aArgs;
    };

    DBConnector.prototype._connectDatabase = function(callback) {
      var _this = this;
      this._log(2, "use:start");
      this["native"].query("USE " + this.database, function(err, results) {
        if (err) {
          throw err;
        }
        _this.isConnected = true;
        _this.isConnecting = false;
        if (callback) {
          callback();
        }
        _this._runQueue();
        _this.emit("connected", true);
      });
      this._log(2, "use:done");
    };

    DBConnector.prototype._setupConnection = function() {
      if (this.user && this.password) {
        this._log(2, "setup:start");
        this["native"].user = this.user;
        this["native"].password = this.password;
        this["native"].host = this.host;
        this["native"].port = this.port;
        this._log(2, "setup:done");
      } else {
        this._log(1, "setup", "User or password not defined.");
        throw new AuthenticationFailed("User or password not defined.");
      }
    };

    DBConnector.prototype._log = function(lvl, type, args) {
      if (lvl === 1 && this.logLevel >= lvl) {
        console.log("DBConnector-ERROR: ", this.runningConnections, this.runningQuerys, type, args != null ? args :  null);
      } else if (lvl === 2 && this.logLevel >= lvl) {
        console.log("DBConnector-INFO: ", this.runningConnections, this.runningQuerys, type, args != null ? args :  null);
      }
    };

    DBConnector.prototype._addToQueue = function(fn, args, context) {
      this.queue.push({
        fn: fn,
        args: args,
        context: context
      });
    };

    DBConnector.prototype._runQueue = function() {
      var data;
      if (this.queue.length) {
        data = this.queue[0];
        data.fn.apply(data.context, data.args);
        this.queue = _.rest(this.queue);
        this._runQueue();
      }
    };

    return DBConnector;

  })(EventEmitter);

  AuthenticationFailed = function(msg) {
    this.name = "DBConnector:AuthenticationFailed";
    Error.call(this, msg);
    return Error.captureStackTrace(this, arguments.callee);
  };

  SetupFailed = function(msg) {
    this.name = "DBConnector:SetupFailed";
    Error.call(this, msg);
    return Error.captureStackTrace(this, arguments.callee);
  };

  module.exports = DBConnector;

}).call(this);
