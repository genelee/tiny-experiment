import TinyExperiment from './tinyExperiment';
import 'promise-polyfill';

class TinyExperimentManager {

  static get defaultCompletionHandler() {
    return function(params) {
      if (!window.analytics || !window.analytics.track) {
        throw new Error('Tiny by default uses the segment library to populate experiment results data. To customize, pass in a function value to key globalExperimentCompletionHandler in the init() method');
      }

      window.analytics.ready(() => {
        window.analytics.track('Experiment Viewed', params);
      });
    }
  }

  constructor() {
    this.experiments = [];
    this.globalExperimentCompletionHandler = TinyExperimentManager.defaultCompletionHandler;
    this.experimentRegistrationPromise = new Promise((_resolve) => {
      this._resolveExperimentRegistration = _resolve;
    });

    document.addEventListener('DOMContentLoaded', function handler() {
      document.removeEventListener('DOMContentLoaded', handler.bind(this), false);
      this.parseURLForManualExperimentation();
    }.bind(this), false);
  }

  setup(args) {
    if (!args.experiments) {
      throw new Error('Tiny experiment setup requires experiments as an array')
    }

    this.setExperiments(args.experiments);

    if (args.globalExperimentCompletionHandler) {
      if (typeof args.globalExperimentCompletionHandler != 'function') {
        throw new TypeError('Global completion handler must be a function');
      }
      this.globalExperimentCompletionHandler = args.globalExperimentCompletionHandler
    }
  }

  init(args) {
    return this.setup(args);
  }

  setExperiments(experiments = []) {
    this.experiments = experiments.map((e) => {
      if (!e.completionHandler) {
        e.completionHandler = TinyExperimentManager.defaultCompletionHandler;
      }
      return new TinyExperiment(e);
    });

    this._resolveExperimentRegistration();
  }

  getExperiment(experimentKey = String()) {
    return this.experiments.filter((e) => { return experimentKey == e.experimentKey })[0];
  }

  parseURLForManualExperimentation() {
    let key = getURLParameter('experimentKey')
    let expInt = getURLParameter('variantInt')
    let expName = getURLParameter('variantName')

    var param;
    if (expInt && !isNaN(expInt)) {
      param = expInt;
    } else {
      param = expName;
    }
    if (key && param) {
      this.experimentRegistrationPromise.then(function (key, expInt, expName) {
        if (!this.getExperiment(key)) {
          throw new ReferenceError('Tried to manually run experiment (' + key + ') that is not registered.')
        }

        this.getExperiment(key).run(param);
      }.bind(this, key, expInt, expName));
    }
  }
}

function getURLParameter(param) {
  return decodeURIComponent(
  (new RegExp('[?|&]' + param + '=' + '([^&;]+?)(&|#|;|$)')
    .exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}

let manager = new TinyExperimentManager();
if (window) window.tinyManager = manager;
export default manager