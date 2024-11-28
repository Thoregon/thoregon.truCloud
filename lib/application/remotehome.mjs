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

const I18N_NOPTIONS = {
    // These are the defaults:
    debug: false,  //[Boolean]: Logs missing translations to console and add "@@" around output, if `true`.
    array: false,  //[Boolean]: Returns translations with placeholder-replacements as Arrays, if `true`.
    resolveAliases: false,  //[Boolean]: Parses all translations for aliases and replaces them, if `true`.
    pluralize: function(n){ return Math.abs(n) },  //[Function(count)]: Provides a custom pluralization mapping function, should return a string (or number)
    useKeyForMissingTranslation: true //[Boolean]: If there is no translation found for given key, the key is used as translation, when set to false, it returns undefiend in this case
}

let translations;

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
        this.initTranslations();
    }

    async initTranslations() {
        if (translations) return;
        try {
            const translationfile = app._import + '/i18n/de_i18n.json';
            const translationjson = await thoregon.source(translationfile);
            const translationsDE = JSON.parse(translationjson);
            translations         = {
                de_DE: translate(translationsDE, {
                    ...I18N_NOPTIONS,
                    pluralize: plurals.plural_DE,       // todo: select language
                })
            };
        } catch (e) {
            console.log("EasyPay Home: can't init translations", e);
        }
    }

    getTranslator(locale) {
        return translations.de_DE;
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