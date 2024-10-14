/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { doAsync, timeout } from "/evolux.universe";

import { EventEmitter }     from "/evolux.pubsub";
import { Reporter }         from "/evolux.supervise";
import Mediathek            from "./unifiedfile/mediathekremote.mjs";
import URLRouter            from "./application/urlrouter.mjs";
import AppStructure         from "./application/appstructure.mjs";

export default class DoriferRemote extends Reporter(EventEmitter) {

    constructor(...args) {
        super();
        this._started    = false;
        this.contexts    = {};
        this.annotations = {};
    }

    async init() {
        universe.$dorifer = this;
        universe.global('dorifer', this);

        const appElement = document.querySelector('thoregon-app');
        this.appElement = appElement;
        thoregon.checkpoint("dorifer: mediathek open");
        let mediathek = await Mediathek.open();
        universe.global('mediathek', mediathek);
        thoregon.checkpoint("dorifer: mediathek opened");

        let urlrouter  = new URLRouter();
        this.urlrouter = urlrouter;
        urlrouter.prepare();
        universe.lifecycle.addEventListener('resume', (evt) => this.browserVisible({ ...evt, origin: 'visibility' }));
        document.body.addEventListener('focus', (evt) => this.browserVisible({ ...evt, origin: 'bodyfocus' }));
        thoregon.checkpoint("dorifer: URL router prepared");

/*
        if (universe.ssi) {
            await universe.Identity.hosted(universe.ssi);
        }
*/
    }

    async restartApp() {
        if (this._started) return;
        this._started = true;
        if (window.neulandconfig?.conn === 'duplex') await universe.connector.whenConnected('sa');
        const appname = thoregon.appname;
        if (!appname) return;
        thoregon.checkpoint("dorifer: restart app");
        const ctx = await this.findMatchingApp(appname);
        if (!ctx) return;
        thoregon.checkpoint("dorifer: app found");
        // debugger;
        this.top = ctx;
        const app = ctx.app;

        if (!(await app.prepare())) return;

        await app.restart();
        thoregon.checkpoint("dorifer: app restarted");
        if (app.restore) await app.restore();
        thoregon.checkpoint("dorifer: app restored");
        if (this.top.ui && this.hasAppElement) {
            let uirouter         = universe.uirouter;
            this.uirouter        = uirouter;
            uirouter.app         = app;
            uirouter.urlrouter   = this.urlrouter;
            uirouter.applyInterfaceSettings(app);
            let ui               = ctx.ui;
            let view             = this.appElement.top(ui);   // set the top App UI element. Will be (re)started after init
            uirouter.appelement  = view;
            view.app             = app;
            view.appname         = appname;
            this.top.view = view;
            await view.untilExist();
            // todo [OPEN]: restore UI state
            view.prepareEnveloping();

            thoregon.checkpoint("dorifer: view prepared");
            await doAsync();
            if (!await app.connectUI(view)) {
                // connect Model and UI#
                thoregon.checkpoint("dorifer: default connect UI");
                let vm      = universe.aurora.ViewModel();
                this.top.vm = vm;
                vm.view     = view;
                vm.model    = universe.observe(app);
            };
            thoregon.checkpoint("dorifer: UI connected");
            await doAsync();
            await view.awaken();
            uirouter.restore();
            thoregon.checkpoint("dorifer: app started");
            this._restarting = false;
        }   // if peer has a UI
    }

    async findMatchingApp(appname) {
        try {
            thoregon.checkpoint("dorifer: find app 1");
            // const href = `/${appname}`;
            const href = `/${appname}`;
            const Module = await import(`/${appname}/app.mjs`);
            // const App = Module.default;
            thoregon.checkpoint("dorifer: find app 2 fetched");
            const struct = await AppStructure.from(appname, href);
            thoregon.checkpoint("dorifer: find app 3 app structure built");
            // return struct;
            const ctx = this.contexts[appname];
            // const app = new App();
            // ctx.app = app;
            return ctx;
        } catch (e) {
            // if (appname.indexOf('@') === -1) return await this.findInRepo(`${appname}@1.0.0`);
            // todo [OPEN]: check first if the resource is available, if so and the import fails there must be a JS error (Syntax, Reference, ...)
            console.log('Dev Repo', e);
        }

    }

    context(ctxname) {
        let ctx = this.contexts[ctxname];
        if (ctx) return ctx;
        ctx = new DoriferContext(ctxname, this);
        this.contexts[ctxname] = ctx;
        return ctx;
    }

    get hasAppElement() {
        return !!this.appElement;
    }

    //
    //
    //

    browserVisible(evt) {
        // todo [OPEN]: check if browser cache/local data has been deleted
        //  - check if SSI is available
        //  - restart (login, sync)
        //  CAUTION:
        //      - this is not perfect reliable
        //      - combined visibility/body focus works for most cases
        //      - check special cases
    }

    //
    //
    //

    checkinClass(origin, cls, metaClass) {}

    checkinAnnotation({ url:origin } = {}, annotation, name) {}

    cls4origin(origin) {}

    origin4cls(Cls) {}

    /*
     * service implementation.
     * on start setup the tru cloud
     */

    install() {}
    uninstall() {}
    resolve() {}
    async start() {
        await this.init();

        this.emit('ready', { dorifer: this });
    }
    async stop() {
        await this.cleanup();
        this.emit('exit', { dorifer: this });
    }

    update() {}


    /*
     * EventEmitter implementation
     */

    get publishes() {
        return {
            ready       : 'DoriferRemote ready',
            exit        : 'DoriferRemote exit',
        };
    }

}

class DoriferContext {

    constructor(ctxname, dorifer) {
        this.dorifer     = dorifer;
        this.ctxname     = ctxname;
    }

    seal() {}

    addAppDefault(app, ui) {
        this.app = app;
        this.ui  = ui;
        return this;
    }

    withStructure(appstructure) {
        this.structure = appstructure;
        return this;
    }

    withInterface(interfce) {
        this.interface = interfce;
        return this;
    }

    withI18N(translation) {
        this.i18n = translation;
    }

    withUI(path) {
        this.uibase = path;
    }

    withAssets(path) {
        this.assets = path;
    }

    getInterface() {
        return this.interface;
    }

    getStructure() {
        return this.structure;
    }

    getI18N() {
        return this.i18n;
    }
}