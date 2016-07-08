export default class TinyExperimentCookieInterface() {
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