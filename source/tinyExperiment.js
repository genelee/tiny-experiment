import TinyExperimentCookieInterface from './tinyExperimentCookieInterface';

export default class TinyExperiment {
  constructor(args = {}) {
    this.cached = args.cached || false;
    this.cachePeriod = args.cachePeriod || 7;
    this.completionHandler = args.completionHandler;
    this.experimentKey = args.experimentKey;
    this.experimentName = args.experimentName;
    this.tracked = false;
    this.variantInt = this.getRandomVariant(args.variantNames.length);
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
      throw new TypeError("Failed to setup experiment (" + this.experimentKey + ") due to improperly typed experiment meta data");
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

    this.completion.then(() => {
      if (typeof this.variantHandlers[this.variantName] == 'function') {
        this.variantHandlers[this.variantName]();
      }
      this.tracked = true;
      this.completionHandler.call(this, {
        experimentName: this.experimentName,
        variantInt: this.variantInt,
        variantName: this.variantName,
        variantNames: this.variantNames
      });
    });
  }

  on(variantName = String(), handler = () => {}) {
    this.variantHandlers[variantName] = handler;
    return this; // to chain .on(func).on(func).run()
  }

  run() {
    const experimentKey = this.experimentKey;

    if (typeof arguments[0] == "number") {
      const variantInt = arguments[0];
      this.variantInt = variantInt;
      this.variantName = this.variantNames[variantInt];
    }
    else if (typeof arguments[0] == "string") {
      const variantName = arguments[0];
      this.variantName = variantName;
      this.variantInt = this.variantNames.indexOf(variantName);
    }

    if (!this.tracked) {
      this._executeExperiment(this);
    } else {
      this._cancelExperiment();
    }

    return this.completion;
  }

  end() {
    this._cancelExperiment();
  }
}