(function() {
  var Datamodel, INITTREE, Modelfactory, async, moment, _, _arrayInclude, _arrayRemove;

  Datamodel = require('./datamodel').Datamodel;

  async = require('async');

  moment = require('moment');

  _ = require('lodash')._;

  _arrayInclude = function(arrBase, arrAdd) {
    var aEl, _i, _len;
    if (!_.isArray(arrAdd)) {
      arrAdd = [arrAdd];
    }
    if (arrAdd) {
      for (_i = 0, _len = arrAdd.length; _i < _len; _i++) {
        aEl = arrAdd[_i];
        if (_.indexOf(arrBase, aEl) < 0) {
          arrBase.push(aEl);
        }
      }
    }
    return arrBase;
  };

  _arrayRemove = function(arr, val) {
    var part, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = arr.length; _i < _len; _i++) {
      part = arr[_i];
      if (part !== val) {
        _results.push(part);
      }
    }
    return _results;
  };

  module.exports = Modelfactory = (function() {
    function Modelfactory(connector, datamodels) {
      this.connector = connector;
      this.datamodels = datamodels;
      this.models = {};
      this._initModels();
      this._wireModels(this.inittree);
    }

    Modelfactory.prototype._initModels = function() {
      var event, events, fn, modeldata, modelname, _i, _len, _ref, _ref1, _ref2;
      _ref = this.datamodels;
      for (modelname in _ref) {
        modeldata = _ref[modelname];
        this.models[modelname] = new Datamodel(_.extend(modeldata, {
          connector: this.connector,
          factory: this,
          autoinit: false
        }));
        _ref1 = modeldata.events;
        for (events in _ref1) {
          fn = _ref1[events];
          _ref2 = events.split(',');
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            event = _ref2[_i];
            this.models[modelname].on(event, _.bind(fn, this.models[modelname], event));
          }
        }
      }
    };

    Modelfactory.prototype._wireModels = function(modeltree) {
      var modelname, submodels;
      for (modelname in modeltree) {
        submodels = modeltree[modelname];
        if (submodels === null && this.has(modelname)) {
          this.get(modelname).init();
        } else if (submodels !== null) {
          this._wireModels(submodels);
          this.get(modelname).init();
        }
      }
    };

    Modelfactory.prototype.get = function(modelname) {
      return this.models[modelname] || null;
    };

    Modelfactory.prototype.has = function(modelname) {
      var _ref;
      return (_ref = this.models[modelname]) != null ? _ref : true;
    };

    return Modelfactory;

  })();

  module.exports = Modelfactory;

  INITTREE = {
    "Contracts": null,
    "Apikeys": null,
    "Studios": {
      "Users": {
        "Tokens": null
      },
      "Trainingplans": {
        "Templates": null,
        "Trainingelements": null
      },
      "Devicetypes": {
        "Devices": null,
        "Nodegroups": {
          "Trainingitems": {
            "Powersettings": null,
            "Traininglogs": null
          },
          "Nodes": {
            "Servosettings": null
          }
        }
      }
    }
  };

}).call(this);
