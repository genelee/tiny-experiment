import TinyExperiment from 'tinyExperiment';

class TinyExperimentManager {
  constructor() {
    this.experiments = {};
  }

  getExperiment(experimentKey: string) {
    return this.experiments[experimentKey];
  }

  setExperiment(experimentKey: string, args: {}) {
    if (args.active) {
      args.experimentKey = experimentKey;
      if (args.completionHandler && typeof args.completionHandler != 'function') {
        throw TypeError('Completion Handler must be a function');
      }

      if (!args.completionHandler && this.globalExperimentCompletionHandler && typeof this.globalExperimentCompletionHandler == 'function') {
        args.completionHandler = this.globalExperimentCompletionHandler;
      }

      this.experiments[experimentKey] = new TinyExperiment(args);
    }
  }

  setGlobalExperimentCompletionHandler(handler: () => {}) {
    this.globalExperimentCompletionHandler = handler;
  }
}

export default new TinyExperimentManager()