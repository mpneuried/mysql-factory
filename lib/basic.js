(function() {
  var Basic, _, colors, extend,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    slice = [].slice;

  _ = require('lodash')._;

  extend = require('extend');

  colors = require('colors');

  module.exports = Basic = (function(superClass) {
    extend1(Basic, superClass);

    Basic.prototype.extend = extend;

    Basic.prototype.defaults = function() {
      return {
        logging: {
          severity: "warning",
          severitys: "fatal,error,warning,info,debug".split(",")
        }
      };
    };


    /*	
    	## constructor 
    
    	`new Baisc( options )`
    	
    	Basic constructor. Define the configuration by options and defaults, init logging and init the error handler
    
    	@param {Object} options Basic config object
     */

    function Basic(options) {
      this.ERRORS = bind(this.ERRORS, this);
      this._initErrors = bind(this._initErrors, this);
      this._checkLogging = bind(this._checkLogging, this);
      this.debug = bind(this.debug, this);
      this.info = bind(this.info, this);
      this.warning = bind(this.warning, this);
      this.error = bind(this.error, this);
      this.fatal = bind(this.fatal, this);
      this._log = bind(this._log, this);
      this.log = bind(this.log, this);
      this._handleError = bind(this._handleError, this);
      this.setter = bind(this.setter, this);
      this.getter = bind(this.getter, this);
      this.define = bind(this.define, this);
      this.initialize = bind(this.initialize, this);
      this.defaults = bind(this.defaults, this);
      this.on("_log", this._log);
      this.config = extend(true, {}, this.defaults(), options);
      this._initErrors();
      this.initialize();
      return;
    }


    /*
    	## initialize
    	
    	`basic.initialize()`
    	
    	Overwritible Method to initialize the module
    	
    	@api public
     */

    Basic.prototype.initialize = function() {};


    /*
    	## define
    	
    	`basic.define( prop, fnGet [, fnSet] )`
    	
    	Helper to define getter and setter methods fot a property
    	
    	@param { String } prop Property name 
    	@param { Function|Object } fnGet Get method or a object with `get` and `set` 
    	@param { Function } [fnSet] Set method
    
    	@api public
     */

    Basic.prototype.define = function() {
      var _oGetSet, fnGet, fnSet, prop;
      prop = arguments[0], fnGet = arguments[1], fnSet = arguments[2];
      if (_.isFunction(fnGet)) {
        _oGetSet = {
          get: fnGet
        };
        if ((fnSet != null) && _.isFunction(fnSet)) {
          _oGetSet.set = fnSet;
        }
        Object.defineProperty(this, prop, _oGetSet);
      } else {
        Object.defineProperty(this, prop, fnGet);
      }
    };


    /*
    	## getter
    	
    	`basic.getter( prop, fnGet )`
    	
    	Shortcut to define a getter
    	
    	@param { String } prop Property name 
    	@param { Function } fnGet Get method 
    	
    	@api public
     */

    Basic.prototype.getter = function(prop, fnGet) {
      Object.defineProperty(this, prop, {
        get: fnGet
      });
    };


    /*
    	## setter
    	
    	`basic.setter( prop, fnSet )`
    	
    	Shortcut to define a setter
    	
    	@param { String } prop Property name 
    	@param { Function } fnSet Get method 
    	
    	@api public
     */

    Basic.prototype.setter = function(prop, fnGet) {
      Object.defineProperty(this, prop, {
        set: fnGet
      });
    };


    /*
    	## _handleError
    	
    	`basic._handleError( cb, err [, data] )`
    	
    	Baisc error handler. It creates a true error object and returns it to the callback, logs it or throws the error hard
    	
    	@param { Function|String } cb Callback function or NAme to send it to the logger as error 
    	@param { String|Error|Object } err Error type, Obejct or real error object
    	
    	@api private
     */

    Basic.prototype._handleError = function(cb, err, data, errExnd) {
      var _err, _k, _v, base, ref, ref1;
      if (data == null) {
        data = {};
      }
      if (_.isString(err)) {
        _err = new Error();
        _err.name = err;
        if (this.isRest) {
          _err.message = ((ref = this._ERRORS) != null ? typeof (base = ref[err])[1] === "function" ? base[1](data) : void 0 : void 0) || "unkown";
        } else {
          _err.message = ((ref1 = this._ERRORS) != null ? typeof ref1[err] === "function" ? ref1[err](data) : void 0 : void 0) || "unkown";
        }
        _err.customError = true;
      } else {
        _err = err;
      }
      if (errExnd != null) {
        _err.data = errExnd;
      }
      for (_k in data) {
        _v = data[_k];
        _err[_k] = _v;
      }
      if (_.isFunction(cb)) {
        cb(_err);
      } else if (_.isString(cb)) {
        this.log("error", cb, _err);
      } else {
        throw _err;
      }
      return _err;
    };


    /*
    	## log
    	
    	`base.log( severity, code [, content1, content2, ... ] )`
    	
    	write a log to the console if the current severity matches the message severity
    	
    	@param { String } severity Message severity
    	@param { String } code Simple code the describe/label the output
    	@param { Any } [contentN] Content to append to the log
    	
    	@api public
     */

    Basic.prototype.log = function() {
      var args, code, content, severity;
      severity = arguments[0], code = arguments[1], content = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      args = ["_log", severity, code];
      this.emit.apply(this, args.concat(content));
    };


    /*
    	## _log
    	
    	`base._log( severity, code [, content1, content2, ... ] )`
    	
    	write a log to the console if the current severity matches the message severity
    	
    	@param { String } severity Message severity
    	@param { String } code Simple code the describe/label the output
    	@param { Any } [contentN] Content to append to the log
    	
    	@api private
     */

    Basic.prototype._log = function() {
      var _c, _tmpl, args, code, content, i, len, severity;
      severity = arguments[0], code = arguments[1], content = 3 <= arguments.length ? slice.call(arguments, 2) : [];
      if (this._checkLogging(severity)) {
        _tmpl = "%s %s - " + (new Date().toString().slice(4, 24)) + " - %s ";
        args = [_tmpl, severity.toUpperCase(), this.constructor.name, code];
        if (content.length) {
          args[0] += "\n";
          for (i = 0, len = content.length; i < len; i++) {
            _c = content[i];
            args.push(_c);
          }
        }
        switch (severity) {
          case "fatal":
            args[0] = args[0].red.bold.inverse;
            console.error.apply(console, args);
            console.trace();
            break;
          case "error":
            args[0] = args[0].red.bold;
            console.error.apply(console, args);
            break;
          case "warning":
            args[0] = args[0].yellow.bold;
            console.warn.apply(console, args);
            break;
          case "info":
            args[0] = args[0].blue.bold;
            console.info.apply(console, args);
            break;
          case "debug":
            args[0] = args[0].green.bold;
            console.log.apply(console, args);
            break;
        }
      }
    };

    Basic.prototype.fatal = function() {
      var args, code, content;
      code = arguments[0], content = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      args = ["_log", "fatal", code];
      this.emit.apply(this, args.concat(content));
    };

    Basic.prototype.error = function() {
      var args, code, content;
      code = arguments[0], content = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      args = ["_log", "error", code];
      this.emit.apply(this, args.concat(content));
    };

    Basic.prototype.warning = function() {
      var args, code, content;
      code = arguments[0], content = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      args = ["_log", "warning", code];
      this.emit.apply(this, args.concat(content));
    };

    Basic.prototype.info = function() {
      var args, code, content;
      code = arguments[0], content = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      args = ["_log", "info", code];
      this.emit.apply(this, args.concat(content));
    };

    Basic.prototype.debug = function() {
      var args, code, content;
      code = arguments[0], content = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      args = ["_log", "debug", code];
      this.emit.apply(this, args.concat(content));
    };


    /*
    	## _checkLogging
    	
    	`basic._checkLogging( severity )`
    	
    	Helper to check if a log will be written to the console
    	
    	@param { String } severity Message severity
    	
    	@return { Boolean } Flag if the severity is allowed to write to the console
    	
    	@api private
     */

    Basic.prototype._checkLogging = function(severity) {
      var iServ;
      if (this._logging_iseverity == null) {
        this._logging_iseverity = this.config.logging.severitys.indexOf(this.config.logging.severity);
      }
      iServ = this.config.logging.severitys.indexOf(severity);
      if ((this.config.logging.severity != null) && iServ <= this._logging_iseverity) {
        return true;
      } else {
        return false;
      }
    };


    /*
    	## _initErrors
    	
    	`basic._initErrors(  )`
    	
    	convert error messages to underscore templates
    	
    	@api private
     */

    Basic.prototype._initErrors = function() {
      var key, msg, ref;
      this._ERRORS = this.ERRORS();
      ref = this._ERRORS;
      for (key in ref) {
        msg = ref[key];
        if (this.isRest) {
          if (!_.isFunction(msg[1])) {
            this._ERRORS[key][1] = _.template(msg[1]);
          }
        } else {
          if (!_.isFunction(msg)) {
            this._ERRORS[key] = _.template(msg);
          }
        }
      }
    };

    Basic.prototype.ERRORS = function() {
      return {
        "not-implemented": "This function is planed but currently not implemented"
      };
    };

    return Basic;

  })(require('events').EventEmitter);

}).call(this);
