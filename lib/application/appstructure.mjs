/**
 * Analyse and determine structure of an app (component)
 *
 * Add:
 * - contracts
 * - constraints (for firewall)
 * - permissions
 * - widgets
 *
 * todo [OPEN]:
 *  - specify needed service mesh(s)
 *  - specify lone services
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import Reporter            from "/evolux.supervise/lib/reporter.mjs";
import ComponentDescriptor from "/evolux.dyncomponents/lib/component/componentcontext.mjs";
import ThoregonApplication from "/thoregon.truCloud/lib/application/thoregonapplication.mjs";
// import { UISTRUCT }        from "/thoregon.aurora/lib/auroraelement.mjs";
import TestDataRepo        from "./testdatarepo.mjs";
import ResourceProxy       from "../resource/resourceproxy.mjs";

let AppElement;
let AuroraElement;

let import_ = async (url)      => {
    try {
        return await import(url);
    } catch (ignore) {
        throw Error("not found: " + url);
    }
}

let fetch_  = async (url, opt) => {
    try {
        return await fetch(url, opt);
    } catch (ignore) {
        throw Error("not found: " + url);
    }
}

let proxy_;

// a structure defines:

export const UISTRUCT = {
    ui        : {
        path: 'ui'
    },
    blueprint : {
        path: 'ui/blueprint'
    },
    views     : {
        path: 'ui/views'
    },
    components: {
        path: 'ui/components'
    },
    i18n      : {
        path: 'i18n'
    },
    schemas   : {
        path: 'lib/schemas'
    },
};

const structure = {

    ...UISTRUCT,

    commands : {
        path: 'lib/commands'
    },
    queries  : {
        path: 'lib/queries'
    },
    assets   : {
        path: 'assets'
    },
    testdata : {
        path: 'test/data'
    },
    testspec : {
        path: 'test/spec'
    },
};

const asComponentIdentifier = (module) => {
    // remove first '/'
    let id = (module.startsWith('/')) ? module.substring(1) : module;
    // replace all '.' with '-'
    id = id.replaceAll('.', '-');
    // if id doesn't contain any '-' add 'app-' at start
    if (id.indexOf('-') < 0) id = `app-${id}`;
    return id;
}

const asEntityIdentifier = (filename) => {
    let i = filename.lastIndexOf('.');
    // cut away file extension
    return i > -1 ? filename.substring(0,i) : filename;
}

const filesOnly = (direntries) => direntries.filter((direntry) => direntry.indexOf(':') === -1 || direntry.startsWith('file:')).map((name) => name.startsWith('file:') ? name.substring(5): name);

export default class AppStructure extends Reporter() {

    constructor(descriptor, proxy) {
        super();
        this.descriptor = descriptor;
        this.struct     = descriptor.customStructure || structure;
        this.proxy      = proxy;
    }

    static async from(componentname, href) {
        let descriptor;
        // first try to get 'component.mjs'

        let proxy;
        // if (universe.DEV) {
            proxy_ = proxy = await ResourceProxy.on(href);

            // proxy avalable, replace
            import_ = async (url)      => await proxy.import(url);
            fetch_  = async (url, opt) => await proxy.fetch(url, opt);
        // } else {
        //     import_ = async (url)      => await import(url);
        //     fetch_  = async (url, opt) => await fetch(url, opt);
        // }

        /*
        try {
            descriptor = (await import_(`${href}/component.mjs`)).default;
        } catch (e) {
    // todo [OPEN]: the implementation needs to register everything by itself
            // no 'component.mjs'
            // now try to get 'index.mjs'
            let midx = await this.import(`${module}/index.mjs`);
            try {
            } catch (e2) {
                try {
                    // now try to get 'index.js'
                    let jidx = await this.import(`${module}/index.js`);
                } catch (e3) {
                    // nothing found
                }
            }
        }
        if (!descriptor) {
            // no module description at all, create emtpy one
            descriptor = ComponentDescriptor({
                                                 id          : asComponentIdentifier(componentname),
                                                 href        : href,
                                                 dependencies: []
                                             });
        } else {
            if (!descriptor.href) descriptor.href = href;
        }
        */

        descriptor = ComponentDescriptor({
            id          : asComponentIdentifier(componentname),
            href        : href,
            dependencies: []
        });

        if (!descriptor.id) descriptor.id = asComponentIdentifier(componentname);
        if (!descriptor.href) descriptor.href = href;

        const appstruct = new this(descriptor, proxy);
        await appstruct.prepare(href);
        return appstruct;
    }

    get base() {
        return this.descriptor.href + '/';
    }

    async appElementBase() {
        if (!AppElement) AppElement = (await import("/thoregon.aurora/lib/blueprint/appelement.mjs")).default;
        return AppElement;
    }

    async auroraElement() {
        if (!AuroraElement) AuroraElement = (await import("/thoregon.aurora/lib/auroraelement.mjs")).default;
        return AuroraElement;
    }

    async prepare(href) {
        let base = this.base;
        // explore directories
        // lookup ui
        this.uientries = {}; // await this.request(base + this.struct.ui.path);
        // lookup ui/blueprint
        // this.blueprintentries = await this.request(base + this.struct.blueprint.path);
        // lookup ui/views
        // this.viewsentries = await this.request(base + this.struct.views.path);
        // lookup ui/componentd
        // todo : get from app structure
        this.componentsentries =  this.getDirsFromProxy(base, this.struct.components.path)  // await this.request(base + this.struct.components.path);
        // lookup app i18n
        // todo : get from app structure
        this.i18entries = this.getFilesFromProxy(base, this.struct.i18n.path); // await this.request(base + this.struct.i18n.path);
        // lookup schemas
        // this.schemasentries = await this.request(base + this.struct.schemas.path);
        // lookup commands
        // this.commandentries = await this.request(base + this.struct.commands.path);
        // lookup queries
        // this.querieentries = await this.request(base + this.struct.queries.path);
        // lookup assets
        this.assetsentries = {}; // await this.request(base + this.struct.assets.path);
        // check test data
        // this.hastestdata = await this.exists(base + this.struct.testdata.path);

        // now register
        let ctx = universe.dorifer.context(this.descriptor.id);
        let app = await this.appInstance(href);     // new ThoregonApplication(this.descriptor.id);
        let ui;

        this.app = app;
        app.ctx = ctx;
        if (thoregon.ui && this.uientries) ui = await this.buildAppElement(this.descriptor.id, base + this.struct.ui.path, app);

        await this.defineAppStyles(app);

        ctx
            .addAppDefault(app, ui)
            .withStructure(this);

        // component interface
        try {
            let intface = (await this.import(`${href}/interface.mjs`)).default;
            if (intface) {
                this.interface = intface;
                ctx.withInterface(intface);
            }
        } catch (ignore) {
            // just log
            this.logger.debug(ignore);
        }
        // component exports
        try {
            let exports = (await this.import(`${href}/exports.mjs`)).default;
            if (exports) {
                this.exports = exports;
                ctx.withExports(exports);
            }
        } catch (ignore) {
            // just log
            this.logger.debug(ignore);
        }

        // component routes
        try {
            let routes = (await this.import(`${href}/routes.mjs`)).default;
            if (routes) {
                this.routes = routes;
            }
        } catch (ignore) {
            // just log
            this.logger.debug(ignore);
        }

        // I18N
        // todo [OPEN]: allow change of language by user
        if (this.i18entries) {
            // this.i18entries.entries = filesOnly(this.i18entries.entries);
            const language = this.getCurrentLanguage();
            const entry = this.i18entries.find(entry => entry.startsWith(language));
            if (entry) {
                try {
                    const translation = await this.request(base + this.struct.i18n.path + '/' + entry);
                    ctx.withI18N(translation);
                } catch (e) {
                    console.log("Can't load translations", e);
                }
            }
        }

        // if there is a ui add the path
        // todo [OPEN]: the 'views' and 'blueprint' locations may be overridden by the component descriptor
        if (this.uientries) ctx.withUI(base + this.struct.ui.path);

        // add assets path if exists
        if (this.assetsentries) ctx.withAssets(base + this.struct.assets.path);

        // todo : register schemas

/*  ! outdated
        if (this.commandentries) {
            await this.commandentries.entries.asyncForEach(async (entry) => {
                try {
                    let module  = await this.import(base + this.struct.commands.path + '/' + entry);
                    let command = module.default;
                    let id      = command.id || asEntityIdentifier(entry);
                    ctx.addCommand(id, command);
                } catch (e) {
                    this.logger.debug("Can't load Command", e);
                }
            })
        }
*/

        if (this.querieentries) {
            await this.querieentries.entries.asyncForEach(async (entry) => {
                try {
                    let module = await this.import(base + this.struct.queries.path + '/' + entry);
                    let query  = module.default;
                    let id     = query.id || asEntityIdentifier(entry);
                    ctx.addQuery(id, query);
                } catch (e) {
                    this.logger.debug("Can't load Query", e);
                }
            })
        }

        if (thoregon.ui && this.componentsentries) {
            await this.auroraElement();
            for await (const name of this.componentsentries) {
                try {
                    let module = await this.import(base + this.struct.components.path + '/' + name + '/' + name + '.mjs');
                    let appelement  = module.default;
                    // add to registry for definition path
                    AuroraElement.addAppElement(appelement, base + this.struct.components.path, name);
                } catch (e) {
                    this.logger.debug("Can't load custom element", e);
                }
            }
/*
            await this.componentsentries.entries.asyncForEach(async (entry) => {
                if (entry.type !== 'dir') return;
                try {
                    const pth = entry.path;
                    const name = entry.name;
                    let module = await this.import(pth + '/' + name + '.mjs');
                    let appelement  = module.default;
                    // add to registry for definition path
                    AuroraElement.addAppElement(appelement, base + this.struct.components.path, name);
                } catch (e) {
                    this.logger.debug("Can't load custom element", e);
                }
            })
*/
        }

        await this.requestTestData(ctx);

        // now seal the context
        ctx.seal();
    }

    getDirsFromProxy(base, path) {
        const entries = Object.entries(this.proxy.map).filter(([name, def]) => name.startsWith(base + path) && def.type === 'dir' && (name.substring((base + path).length + 1).indexOf('/') === - 1));
        entries.shift(); // first ist the directory
        const dirs = entries.map(([name, def]) => def.name);
        return dirs;
    }

    getFilesFromProxy(base, path) {
        const entries = Object.entries(this.proxy.map).filter(([name, def]) => name.startsWith(base + path) && def.type === 'file' && (name.substring((base + path).length + 1).indexOf('/') === - 1));
        // entries.pop(); // first ist the directory
        const files = entries.map(([name, def]) => def.path.substring((base+path).length+1));
        return files;
    }

    // todo [OPEN]:
    //  - language from SSI
    //  - the user should can change it in between
    getCurrentLanguage() {
        return 'de';
    }

    async appInstance(href) {
        let App, app;
        let appmodule = this.descriptor.app ?? 'app.mjs';
        let approot = `${href}/${appmodule}`;

        try {
            App = (await this.import(approot)).default;
            app = new App(this.descriptor?.id);
        } catch (err) {
            // todo:
            //   - currently there is no info in the error if is was not found or if there was a parse/syntax error
            //   - check with fetch it it exists, then print parse error
            //   - with the dynamic import thre is very less info where the error is, hope this will be improvved in future
            app = new ThoregonApplication(this.descriptor.id);
            this.logger.debug(">> Can't instantiate App", err.stack ? err.stack : err.message);
        }
        app._import = href;
        universe.global('app', app);
        return app;
    }

    async defineAppStyles(app) {
        const href = this.base + this.struct.ui.path;
        try {
            let appstyles = (await this.import(`${href}/styles.mjs`)).default;
            if (appstyles) {
                const css = await this.loadAppStyles(appstyles);
                app.styles = css;
            }
        } catch (ignore) {
            // just log
            this.logger.debug(ignore);
        }
    }

    async loadAppStyles({ module, styles } = {}) {
        let fullcss = '';
        for await (const style of styles) {
            const csspath = `/${module}/${style}`;
            const css = await this.loadStyle(csspath);
            if (!css) continue;
            fullcss += '\n' + css;
        }
        return fullcss;
    }

    async loadStyle(csspath) {
        try {
            let res = await fetch(csspath); // this.fetch(csspath);
            if (res.ok) {
                let css = await res.text();
                // styles.push(css);
                return css;
            }
        } catch (ignore) {}
    }

    async buildAppElement(name, base, app) {
        await this.appElementBase();
        const _appstruct = this;
        let element = class DefaultAppElement extends AppElement {

            static get elementTag() {
                return name;
            }

            get appStructure() {
                return _appstruct;
            }

            get uiBase() {
                return base;
            }

            get thoregonApp() {
                return app;
            }

            get ctx() {
                return this.app.ctx;
            }

            get appliedTemplateName() {
                return 'blueprint';
            }
        }
        element.defineElement();
        return element;
    }

    async requestTestData(ctx) {
        if (!thoregon.isDev) return;
        if (!this.hastestdata) return;

        const testdata = new TestDataRepo(this.base + this.struct.testdata.path);
        this.app.testDataRepo = testdata;
        // const galaxies = await testdata.provide();
        // ctx.addTempGalaxies(galaxies);
    }

    async request(path) {
        try {
            let res = await this.fetch(path);
            if (res.status !== 200) return;
            let text = await res.text();
            return JSON.parse(text);
        } catch (ignore) { }    // skip anyways if not found
    }

    async exists(path) {
        try {
            return (await this.fetch(path,{ method: 'HEAD' } )).status === 200;
        } catch (ignore) { }
        return false;
    }

    async fetch(path, opt) {
        return await fetch_(path, opt);
    }

    async import(path) {
        return await import_(path);
    }

}
