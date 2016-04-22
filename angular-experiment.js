angular.module('angular-experiment', [])

.factory('ExperimentManager', ['Experiment', 'ipCookie', function(Experiment, ipCookie) {

  class ExperimentManager {
    constructor() {
      this.experiments = {};
      this.experimentIndex = 0;
    }

    getExperiment(experimentKey) {
      return this.experiments[experimentKey];
    }

    setExperiment(experimentKey, args) {
      if (args.active) {
        args.experimentKey = experimentKey;
        args.experimentId = this.experimentIndex;
        this.experiments[experimentKey] = new Experiment(args);
        this.experimentIndex++;
      }
    }
  }

  return ExperimentManager
}])

.factory('Experiment', ['ipCookie', '$q', function(ipCookie, $q) {

  function randomVariant(numPossibilities) {
    return Math.floor(Math.random() * numPossibilities)
  }

  class Experiment {
    constructor(args) {
      const variantInt = args.variantInt || randomVariant(args.variantNames.length || 2)
      this.active = args.active;
      this.cached = args.cached || false;
      this.execution = $q.defer();
      this.experimentKey = args.experimentKey;
      this.experimentName = args.experimentName;
      this.tracked = false;
      this.variantInt = variantInt;
      this.variantNames = args.variantNames;
      this.variantHandlers = {};

      this.cookieKey = "pbExperiment_" + args.experimentKey;
      this.cookieService = {
        getVariant(key) {
          return ipCookie(key);
        },

        setVariant(key: string, variant: string, expiry: number) {
          ipCookie(key, variant, { expires: expiry });
          return true;
        }
      };

      this.setVariantData();
    }

    on(key: string, handler: () => {}) {
      this.variantHandlers[key] = handler;
      this.execution.promise.then(() => {
        if (key == this.variantName) {
          this.variantHandlers[key]();
        }
      });

      return this;
    }

    setVariantData() {
      const validArray = typeof this.variantNames != 'undefined' && this.variantNames.constructor.name === 'Array' && this.variantNames.length > 0;
      if (typeof this.variantInt == 'number' && validArray) {
        this.variantName = this.variantNames[this.variantInt];
      } else {
        console.error("Experiment failed to setup due to improperly typed experiment meta data");
        return false;
      }

      if (this.cached) {
        if (this.cookieService.getVariant(this.experimentKey)) {
          this.variantName = this.cookieService.getVariant(this.experimentKey);
          this.variantInt = this.variantNames.indexOf(this.variantName);
        } else {
          this.cookieService.setVariant(this.experimentKey, this.variantName, 7);
        }
      }
    }

    run() {
      const experimentKey = this.experimentKey;

      // Overrides variantName and variantInt if second argument is an integer (variantInt)
      if (typeof arguments[0] == "number") {
        this.manualVariant = true;
        const variantInt = arguments[0];
        this.active = true;
        this.variantInt = variantInt;
        this.variantName = this.variantNames[variantInt];
      }
      else if (typeof arguments[0] == "string") {
        this.manualVariant = true;
        const param = arguments[0];
        this.active = true;
        this.variantName = param;
        this.variantInt = this.variantNames.indexOf(param);
      }

      if (this.active && !this.tracked) {
        this.track();
        this.execution.resolve(this);

      } else {
        this.execution.reject();

      }

      return this.execution.promise;
    }

    end() {
      this.active = false;
      this.execution.reject();
    }

    track() {
      /*
      $analytics.eventTrack('Experiment Viewed', {
        experimentName: this.experimentName,
        variantInt: this.variantInt,
        variantName: this.variantName,
        variantNames: this.variantNames
      })

      this.tracked = true;
      */
    }
  }

  return Experiment
}])

.directive('pbExperiment', ['$experiment', '$parse', ($experiment, $parse) => {
  return {
    scope: {
      variant: '=',
      key: '=',
      defaultVariant: '='
    },
    restrict: 'A',
    link: (scope, elem, attr) => {
      scope.key = attr.key;
      scope.variant = attr.variant;

      const experiment = $experiment.getExperiment(scope.key);
      if (experiment && experiment.variantName != scope.variant) {
        elem.hide();
      } else {
        if (!scope.defaultVariant) {
          elem.hide();
        }
      }
    }
  }
}])

.service('$experiment', ['$rootScope', 'ExperimentManager', function($rootScope, ExperimentManager) {
  
  $rootScope._experimentManager = new ExperimentManager();
  let manager = $rootScope._experimentManager;

  manager.setExperiment('aDescriptiveNameForYourExperiment', {
    active: true,
    experimentName: 'A descriptive name for your experiment',
    variantNames: ['variantA', 'variantB', 'variantC'],
    cached: true
  });

  return manager;
}])