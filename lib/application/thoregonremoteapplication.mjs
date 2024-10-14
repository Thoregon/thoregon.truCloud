/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import AppInstanceRemote from "./appinstanceremote.mjs";
import translate, * as plurals from '/evolux.util/lib/i18n/translate.mjs';

var I18N_NOPTIONS = {
    // These are the defaults:
    debug: false,  //[Boolean]: Logs missing translations to console and add "@@" around output, if `true`.
    array: false,  //[Boolean]: Returns translations with placeholder-replacements as Arrays, if `true`.
    resolveAliases: false,  //[Boolean]: Parses all translations for aliases and replaces them, if `true`.
    pluralize: function(n){ return Math.abs(n) },  //[Function(count)]: Provides a custom pluralization mapping function, should return a string (or number)
    useKeyForMissingTranslation: true //[Boolean]: If there is no translation found for given key, the key is used as translation, when set to false, it returns undefiend in this case
}

const DBGID = '++ AppInstance';

let REMOTE_HOME_SERVICE;
export const getRemoteHomeService = async () => (REMOTE_HOME_SERVICE ? REMOTE_HOME_SERVICE : REMOTE_HOME_SERVICE = universe.wsconnector.consumerFor('sa', 'remotehome'));

export default class ThoregonRemoteApplication {

    constructor(name) {
        this._name      = name;
        this._current   = undefined;
    }

    get id() {
        return this._name ?? this.constructor.name;
    }

    get current() {
        return this._current;
    }

    set current(app) {
        return this._current = app;
    }

    static get applicationVersion() { return '0.0.1-initial'; }

    async prepare() {
        // implement by subclasses
    }

    async restart() {
        const appinstance = await this.selectInstance();

        if (!appinstance) return;   // todo [CHECK]: is an app instance required? (currently not)
    }

    async selectInstance() {
        if (this.current) return;
        const { service, spec } = await this.getAppInstanceSpec();
        const startApp = AppInstanceRemote.withSpec(service, spec);
        startApp.restart();
        this._current   = startApp;
    }

    async getAppInstanceSpec() {
        const service = await getRemoteHomeService();
        const spec = await service.getAppInstanceSpec();
        return { service, spec };
    }

    async connectUI(view) {
        // todo [OPEN]: check if thoregon app
        //  - can specify its own view model
        //  - is a view model
        let vm = await universe.aurora.ViewModel();
        vm.model = universe.observe(this);
        vm.view = view;
        return true;
    }

    get interfaceSettings() {
        if (this._interfaceSettings) return this._interfaceSettings;
        const appElement = dorifer?.appElement;
        this._interfaceSettings = appElement?.getAttributeNames().reduce((obj, name) => { obj[name] = appElement.getAttribute(name); return obj; }, {}) ?? {};
        if (!this.ctx || !this.ctx.getInterface()) return this._interfaceSettings;
        let properties = Object.entries(this.ctx.getInterface()).map(([name, spec]) => { return { name, value: spec.default } });
        properties.forEach((property) => this._interfaceSettings[property.name] = property.value);
        return this._interfaceSettings;
    }

    // todo [REFACTOR]: target language for user setting
    getTranslator() {
        if (!this._translator) {
            const translation = this.getI18N();
            this._translator = translation
                               ? translate(translation, {
                    ...I18N_NOPTIONS,
                    pluralize: plurals.plural_EN,       // todo: select language
                })
                               : (...args) => `${args.join(',')}`;
        }
        return this._translator;
    }

    getI18N() {
        return this._I18N ?? this.ctx.getI18N();
    }
}