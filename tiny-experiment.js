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

class TinyExperimentCookieInterface() {
  constructor() {
    this.namespace = "tinyExperiment_";
  }

  getVariant(key: string) {
    return this._getCookie(this.namespace + key);
  }

  setVariant(key: string, variant: string, expiry: number) {
    this._setCookie(this.namespace + key, variant, expiry)
    return true;
  }

  _getCookie(cname: string) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length,c.length);
        }
    }
    return "";
  }

  _setCookie(cname: string, cvalue: string, exdays: number) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
  }
}

class TinyExperiment {
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