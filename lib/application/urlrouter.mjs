/**
 * Route to an app based on URL patterns
 *
 * supports subdomains as well as path specifications
 * the URL parameters are also passed to the app
 *
 * registered mapping will be evaluated in the order they are registered
 * first match wins.
 *
 * supplies for the browser loader all defined domains and paths
 * implements the BrowserLoaderPlugin inteface for this purpose
 *
 * @author: Martin Neitz, Bernhard Lukassen
 * @licence: MIT
 */
import themebehavior from "../../../thoregon.aurora/themes/themebehavior.mjs";

export default class URLRouter {

    constructor() {
        this.mapping = [];
    }

    connect(registry) {
        this.registry = registry;
        // create default mappings for params
        registry.names().forEach(name => this.mapping.push(new URLMapping().resolveQuery(name)));
    }

    updateMapping(registry) {
        registry.names().forEach(name => this.mapping.push(new URLMapping().resolveQuery(name)));
    }

    /**
     * get the matching app for the url
     * @param urlstr
     */
    matchingApp(urlstr) {
        let url = new URL(urlstr);
        let mapping = this.mapping.find(mapping => mapping.matches(url));
        return mapping ? this.registry.get(mapping.appname) : null;
    }
}

/**
 * URL mapping to an app
 *
 * Resolves URL:
 * - queryparam       ... any domain, use ?app=name
 */
class URLMapping {

    /**
     * resolve the queryparam 'app'
     *
     * @param appname
     */
    resolveQuery(appname) {
        this.appname = appname;
        this._fn = (url) => {
            let params = new URLSearchParams(url.search);
            let appparam = params.get('app');
            return appparam ? appparam === appname : false;
        };
        return this;
    }

    /**
     * resolves domain names to apps
     * @param domain
     * @param appname
     */
    resolveDomain(domain, appname) {
        this.domain = domain;
        this.appname = appname;
        this._fn = (url) => {
            return this.domain === url.hostname ? this.appname : null;
        };
        return this;
    }

    hasPath() {
        return !!this.domain;
    }

    hasDomain() {
        return !!this.domain;
    }

    /**
     *
     * @param fn
     * @param appname
     */
    resolve(fn, appname) {
        this._fn     = fn;
        return this;
    }

    /**
     * check if the given URL matches the app
     * @param {URL} url to match the app
     */
    matches(url) {
        return this._fn(url);
    }
}
