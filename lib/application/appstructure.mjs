/**
 * Analyse and determine structure of an app (component)
 *
 * Add:
 * - contracts
 * - constraints (for firewall)
 * - permissions
 * - widgets
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import Reporter            from "/evolux.supervise/lib/reporter.mjs";

import ComponentDescriptor from "/evolux.dyncomponents/lib/component/componentcontext.mjs";
import ThoregonApplication from "/thoregon.truCloud/lib/application/thoregonapplication.mjs";
import AuroraElement       from "/thoregon.aurora/lib/auroraelement.mjs";
import TestData            from "./testdata.mjs";
import ResourceProxy       from "../resource/resourceproxy.mjs";

let AppElement;

let import_ = async (url)      => await import(url);
let fetch_  = async (url, opt) => await fetch(url, opt);

// a structure defines:
// -
const structure = {
    ui       : {
        path: 'ui'
    },
    ui18n    : {
        path: 'ui/i18n'
    },
    blueprint: {
        path: 'ui/views/blueprint'
    },
    views    : {
        path: 'ui/views'
    },
    components    : {
        path: 'ui/components'
    },
    i18n     : {
        path: 'lib/i18n'
    },
    schemas : {
        path: 'lib/schemas'
    },
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
        path: 'test'
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

        const proxy = await ResourceProxy.on(href);

        // proxy avalable, replace
        import_ = async (url)      => await proxy.import(url);
        fetch_  = async (url, opt) => await proxy.fetch(url, opt);

        try {
            descriptor = (await proxy.import(`${href}/component.mjs`)).default;
        } catch (e) {
/*
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
*/
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

    async prepare(href) {
        let base = this.base;
        // explore directories
        // lookup ui
        this.uientries = await this.request(base + this.struct.ui.path);
        // lookup ui i18n
        this.ui18entries = await this.request(base + this.struct.ui18n.path);
        // lookup ui/blueprint
        this.blueprintentries = await this.request(base + this.struct.blueprint.path);
        // lookup ui/views
        this.viewsentries = await this.request(base + this.struct.views.path);
        // lookup ui/componentd
        this.componentsentries = await this.request(base + this.struct.components.path);
        // lookup app i18n
        this.i18entries = await this.request(base + this.struct.i18n.path);
        // lookup schemas
        this.schemasentries = await this.request(base + this.struct.schemas.path);
        // lookup commands
        this.commandentries = await this.request(base + this.struct.commands.path);
        // lookup queries
        this.querieentries = await this.request(base + this.struct.queries.path);
        // lookup assets
        this.assetsentries = await this.request(base + this.struct.assets.path);
        // check test data
        this.hastestdata = await this.exists(base + this.struct.testdata.path);

        // now register
        let ctx = universe.dorifer.context(this.descriptor.id);
        let app = new ThoregonApplication(this.descriptor.id);
        let ui;

        app.ctx = ctx;
        if (thoregon.ui && this.uientries) ui = await this.buildAppElement(this.descriptor.id, base + this.struct.ui.path, app);

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

        // if there is a ui add the path
        // todo [OPEN]: the 'views' and 'blueprint' locations may be overridden by the component descriptor
        if (this.uientries) ctx.withUI(base + this.struct.ui.path);

        // add assets path if exists
        if (this.assetsentries) ctx.withAssets(base + this.struct.assets.path);

        // todo : register schemas

        if (this.commandentries) {
            await this.commandentries.entries.aForEach(async (entry) => {
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

        if (this.querieentries) {
            await this.querieentries.entries.aForEach(async (entry) => {
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

        if (this.componentsentries) {
            await this.componentsentries.entries.aForEach(async (entry) => {
                try {
                    let module = await this.import(base + this.struct.components.path + '/' + entry + '/' + entry + '.mjs');
                    let appelement  = module.default;
                    // add to registry for definition path
                    AuroraElement.addAppElement(appelement, base + this.struct.components.path, entry);
                } catch (e) {
                    this.logger.debug("Can't load custom element", e);
                }
            })
        }

        await this.requestTestData(ctx);

        // now seal the context
        ctx.seal();
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
        const testdata = new TestData(this.base + this.struct.testdata.path);
        const galaxies = await testdata.provide();
        ctx.addTempGalaxies(galaxies);
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
