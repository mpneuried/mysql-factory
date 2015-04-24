(function() {
  var Datamodel, INITTREE, Modelfactory, _, _arrayInclude, _arrayRemove, async, moment, utils;

  Datamodel = require('./datamodel').Datamodel;

  async = require('async');

  moment = require('moment');

  _ = require('lodash')._;

  utils = require("../lib/utils");

  _arrayInclude = function(arrBase, arrAdd) {
    var aEl, i, len;
    if (!_.isArray(arrAdd)) {
      arrAdd = [arrAdd];
    }
    if (arrAdd) {
      for (i = 0, len = arrAdd.length; i < len; i++) {
        aEl = arrAdd[i];
        if (_.indexOf(arrBase, aEl) < 0) {
          arrBase.push(aEl);
        }
      }
    }
    return arrBase;
  };

  _arrayRemove = function(arr, val) {
    var i, len, part, results;
    results = [];
    for (i = 0, len = arr.length; i < len; i++) {
      part = arr[i];
      if (part !== val) {
        results.push(part);
      }
    }
    return results;
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
      var event, events, fn, i, len, modeldata, modelname, ref, ref1, ref2;
      ref = this.datamodels;
      for (modelname in ref) {
        modeldata = ref[modelname];
        this.models[modelname] = new Datamodel(_.extend(modeldata, {
          connector: this.connector,
          factory: this,
          autoinit: false
        }));
        ref1 = modeldata.events;
        for (events in ref1) {
          fn = ref1[events];
          ref2 = events.split(',');
          for (i = 0, len = ref2.length; i < len; i++) {
            event = ref2[i];
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
      var ref;
      return (ref = this.models[modelname]) != null ? ref : true;
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
