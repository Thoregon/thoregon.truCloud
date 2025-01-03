/**
 * Route to an app based on URL patterns
 *
 * @see: doc/repositories.md
 *
 * @author: Martin Neitz, Bernhard Lukassen
 * @licence: MIT
 */

import { parseRoute } from "/evolux.util/lib/formatutils.mjs"

export default class URLRouter {

    constructor() {
        this.appid       = undefined;
        this.route       = '';
        this.appInDomain = false;
        this.appidInPath = false;
        this.appidInHash = false;
    }

    prepare() {
        const location = window.location;
        const hash = location.hash || thoregon.apphash;

        // analyze the URL and get the information about app and the route to the view
        if (hash) {
            this.hash = hash;
            // get app identifier and route from the hash
            const path = parseRoute(hash);
            this.appid = path.shift(); // get first element
            this.route = path;         // remaining path elements as route
            this.appidInHash = true;
        }

        // map domain to component
        // if multi app domain first path item is the app identifier
        // get default app from domain
    }

    /**
     *
     * @param {Location | URL } location
     */
    extractRoute(location) {
        if (this.appidInHash) {
            const path = parseRoute(this.hash);
            path.shift();
            return path ;
        }
        // todo [OPEN]: all other cases
    }

    routeForHistory(route) {
        const location = window.location;
        if (this.appidInHash) {
            if (route.startsWith('/')) route = route.substr(1);
            let url = `${location.origin}${location.pathname}#${this.appid}/${route}`;
            return url;
        }
        // todo [OPEN]: all other cases
    }

}
