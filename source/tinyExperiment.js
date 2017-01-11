import TinyExperimentCookieInterface from './tinyExperimentCookieInterface';

export default class TinyExperiment {
  constructor(args = {}) {
    this._numVariantPossibilities = args.variantNames.length;

    this.experimentKey = args.experimentKey;
    this.experimentName = args.experimentName;
    this.variantNames = args.variantNames;
    this.variantWeights = args.variantWeights;
    this.variantId = undefined;

    this._cookies = new TinyExperimentCookieInterface();
    this._cached = args.cached || false;
    this._cachePeriod = args.cachePeriod || 7;
    this._variantHandlers = {};
    this._tracked = false;
    this._completionHandler = args.completionHandler;
    this._completion = new Promise((_resolve, _reject) => {
      this._executeExperiment = _resolve;
      this._cancelExperiment = _reject;
    });

    this.assignVariantId();
    this.assignVariantName();

    // handles experiment caching
    if (this._cached) {
      if (this._cookies.getVariant(this.experimentKey)) {
        this.variantName = this._cookies.getVariant(this.experimentKey);
        this.variantId = this.variantNames.indexOf(this.variantName);
      } else {
        this._cookies.setVariant(this.experimentKey, this.variantName, this._cachePeriod);
      }
    }
  }

  assignVariantId() {
    if (this.variantWeights) {
      let rand = Math.random();
      let i = 0;

      let cumulatedWeight = this.variantWeights.reduce((a, b) => {
        if (this.variantId == undefined && a + b > rand) this.variantId = i;

        i++
        return a + b;
      }, 0);

      if (cumulatedWeight != 1.0) throw new Error('Variant weights must add up to 1.0');
    } else {
      this.variantId = Math.floor(Math.random() * this._numVariantPossibilities);
    }
  }

  assignVariantName() {
    if (!Array.isArray(this.variantNames) || this.variantNames.length == 0) {
      throw new TypeError("Variant names must be an array of strings");
    }

    this.variantName = this.variantNames[this.variantId];
  }

  on(variantName = String(), handler = () => {}) {
    this._variantHandlers[variantName] = handler;
    return this; // to chain .on(func).on(func).run()
  }

  run() {
    const experimentKey = this.experimentKey;

    if (typeof arguments[0] == "number") {
      this.variantId = arguments[0];
      this.variantName = this.variantNames[this.variantId];
    }
    else if (typeof arguments[0] == "string") {
      this.variantName = arguments[0];
      this.variantId = this.variantNames.indexOf(this.variantName);
    }

    if (!this._tracked) {
      this._executeExperiment.bind(this)();
    }
    else {
      this._cancelExperiment();
    }

    this._completion.then(() => {
      if (typeof this._variantHandlers[this.variantName] == 'function') {
        this._variantHandlers[this.variantName]();
      }
      this._tracked = true;
      this._completionHandler.call(this, {
        experimentName: this.experimentName,
        variantId: this.variantId,
        variantName: this.variantName,
        variantNames: this.variantNames
      });
    });

    return this._completion;
  }
}
