import TinyExperimentCookieInterface from './tinyExperimentCookieInterface';

export default class TinyExperiment {
  constructor(args: {}) {
    this.active = args.active;
    this.cached = args.cached || false;
    this.cachePeriod = args.cachePeriod || 7;
    this.experimentKey = args.experimentKey;
    this.experimentName = args.experimentName;
    this.tracked = false;
    this.variantInt = getRandomVariant(args.variantNames.length);
    this.variantNames = args.variantNames;
    this.variantHandlers = {};

    this.completion = new Promise((_resolve, _reject) => {
      this._executeExperiment = _resolve;
      this._cancelExperiment = _reject;
    });

    this.cookies = new TinyExperimentCookieInterface();

    this.init();
  }

  getRandomVariant(possibilities) {
    return Math.floor(Math.random() * possibilities);
  }

  init() {

    const validArray = Array.isArray(this.variantNames) && this.variantNames.length > 0;
    if (typeof this.variantInt == 'number' && validArray) {
      this.variantName = this.variantNames[this.variantInt];
    } else {
      throw TypeError("Experiment failed to setup due to improperly typed experiment meta data");
      return false;
    }

    if (this.cached) {
      if (this.cookies.getVariant(this.experimentKey)) {
        this.variantName = this.cookies.getVariant(this.experimentKey);
        this.variantInt = this.variantNames.indexOf(this.variantName);
      } else {
        this.cookies.setVariant(this.experimentKey, this.variantName, this.cachePeriod);
      }
    }

    if (typeof args.completionHandler != 'function') this.completionHandler = this.defaultCompletionHandler;
    this.completion.then(() => {
      this.variantHandlers[this.variantName]();

      this.tracked = true;

      this.completionHandler.call(this, {
        experimentName: this.experimentName,
        variantInt: this.variantInt,
        variantName: this.variantName,
        variantNames: this.variantNames
      });
    });
  }

  on(variantName: string, handler: () => {}) {
    this.variantHandlers[variantName] = handler;
    return this; // to chain .on(func).on(func).run()
  }

  run() {
    const experimentKey = this.experimentKey;

    if (typeof arguments[0] == "number") {
      const variantInt = arguments[0];
      this.active = true;
      this.variantInt = variantInt;
      this.variantName = this.variantNames[variantInt];
    }
    else if (typeof arguments[0] == "string") {
      const variantName = arguments[0];
      this.active = true;
      this.variantName = variantName;
      this.variantInt = this.variantNames.indexOf(variantName);
    }

    if (this.active && !this.tracked) {
      this._executeExperiment(this);
    } else {
      this._cancelExperiment();
    }

    return this.completion;
  }

  end() {
    this.active = false;
    this._cancelExperiment();
  }

  defaultCompletionHandler(params: {}) {
    window.analytics.track('Experiment Viewed', params);
  }
}