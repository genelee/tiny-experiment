import TinyExperiment from './tinyExperiment';

class TinyExperimentManager {

  static get defaultCompletionHandler() {
    return function(params) {
      window.analytics.ready(() => {
        ('Experiment Viewed', params);
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

  init(args) {
    if (!args.experiments) {
      throw TinyExperimentError('Tiny experiment init() requires experiments')
    }

    this.setExperiments(args.experiments);

    if (args.globalExperimentCompletionHandler) {
      if (typeof args.globalExperimentCompletionHandler != 'function') {
        throw TypeError('Tiny experiment: global completion handler must be a function');
      }
      this.globalExperimentCompletionHandler = args.globalExperimentCompletionHandler
    }
  }

  setExperiments(experiments: []) {
    this.experiments = experiments.map((e) => {
      if (e.active) {
        if (!e.completionHandler) {
          e.completionHandler = TinyExperimentManager.defaultCompletionHandler;
        }
        return new TinyExperiment(e);
      }
    });

    this._resolveExperimentRegistration();
  }

  getExperiment(experimentKey: string) {
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
      console.log('manual experiment', key, expInt, expName);
      this.experimentRegistrationPromise.then(function (key, expInt, expName) {
        if (!this.getExperiment(key)) {
          throw ReferenceError('Tiny experiment: Tried to manually run experiment (' + key + ') that is not registered.')
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

export default new TinyExperimentManager()