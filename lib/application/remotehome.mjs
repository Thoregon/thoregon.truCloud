/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import PromiseChain            from "/thoregon.archetim/lib/promisechain.mjs";
import translate, * as plurals from '/evolux.util/lib/i18n/translate.mjs';


//
// I18N
//

export default class RemoteHome {

    constructor(service, spec) {
        this.service = service;
        this.spec    = spec;
        this.init();
    }

    static forApp(service, spec) {
        const remoteHome = new this(service, spec);
        return remoteHome;
    }

    init() {
        const { home, channels } = this.spec;
        home.forEach((method) => {
            this[method] = (...args) => this._invoke(method, args);
        })
    }

    getTranslator(locale) {
        return app.getTranslator();
    }

    /*async*/ _invoke(method, args) {
        const { proxy, chain } = PromiseChain.with(async (resolve, reject) => {
            try {
                const res = await this.service.invokeHome(method, args);
                resolve(res);
            } catch (e) {
                reject(e);
            }
        });
        return proxy;
    }
}