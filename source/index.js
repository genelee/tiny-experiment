import TinyExperiment from './tinyExperiment';
import 'promise-polyfill';

class TinyExperimentManager {

  static get defaultCompletionHandler() {
    return function(params) {
      if (!window.analytics || !window.analytics.track) {
        throw new Error('Tiny by default uses the segment library to populate experiment results data. To customize, pass in a function value to key globalCompletionHandler in the setup() method');
      }

      window.analytics.ready(() => {
        window.analytics.track('Experiment Viewed', params);
      });
    }
  }

  constructor() {
    this.experiments = [];
    this.globalCompletionHandler = TinyExperimentManager.defaultCompletionHandler;
  }

  setup(args) {
    if (!args.experiments) {
      throw new Error('Tiny experiment setup requires experiments as an array')
    }

    this.addExperiments(args.experiments);

    if (args.globalCompletionHandler) {
      if (typeof args.globalCompletionHandler != 'function') {
        throw new TypeError('Global completion handler must be a function');
      }
      this.globalCompletionHandler = args.globalCompletionHandler
    }

    this.parseURLForManualExperimentation();
  }

  init(args) {
    return this.setup(args);
  }

  addExperiments(experiments = []) {
    let to_add = experiments.map((e) => {
      if (!e.completionHandler) {
        e.completionHandler = TinyExperimentManager.defaultCompletionHandler;
      }
      return new TinyExperiment(e);
    });

    this.experiments = to_add.concat(this.experiments);
  }

  getExperiment(experimentKey = String()) {
    return this.experiments.filter((e) => { return experimentKey == e.experimentKey })[0];
  }

  parseURLForManualExperimentation() {
    let key = getURLParameter('experimentKey')
    let expInt = getURLParameter('variantId')
    let expName = getURLParameter('variantName')

    var param;
    if (expInt && !isNaN(expInt)) {
      param = expInt;
    } else {
      param = expName;
    }
    if (key && param) {
      if (!this.getExperiment(key)) {
        throw new ReferenceError('Tried to manually run experiment (' + key + ') that is not registered.')
      }

      this.getExperiment(key).run(param);
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
module.exports = manager;
