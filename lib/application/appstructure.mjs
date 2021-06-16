/**
 * Analyse and determine structure of an app (component)
 *
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import Reporter            from "/evolux.supervise/lib/reporter.mjs";

import ComponentDescriptor from "/evolux.dyncomponents/lib/component/componentcontext.mjs";
import ThoregonApplication from "/thoregon.truCloud/lib/application/thoregonapplication.mjs";
import AppElement          from "/thoregon.aurora/lib/blueprint/appelement.mjs";

// a structure defines:
// -
const structure = {
    ui       : {
        path: 'ui',
    },
    ui18n    : {
        path: 'ui/i18n',
    },
    blueprint: {
        path: 'ui/views/blueprint'
    },
    views    : {
        path: 'ui/views'
    },
    i18n     : {
        path: 'lib/i18n',
    },
    commands : {
        path: 'lib/commands',
    },
    queries  : {
        path: 'lib/queries',
    }
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

    constructor(descriptor) {
        super();
        this.descriptor = descriptor;
        this.struct     = descriptor.customStructure || structure;
    }

    static async from(componentname, href) {
        let descriptor;
        // first try to get 'component.mjs'
        try {
            descriptor = (await import(`${href}/component.mjs`)).default;
        } catch (e) {
/*
    // todo [OPEN]: the implementation needs to register everything by itself
            // no 'component.mjs'
            // now try to get 'index.mjs'
            let midx = await import(`${module}/index.mjs`);
            try {
            } catch (e2) {
                try {
                    // now try to get 'index.js'
                    let jidx = await import(`${module}/index.js`);
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
        const appstruct = new this(descriptor);
        await appstruct.prepare();
        return appstruct;
    }

    async prepare() {
        let base = this.descriptor.href + '/';
        // explore directories
        // lookup ui
        this.uientries = await this.request(base + this.struct.ui.path);
        // lookup ui i18n
        this.ui18entries = await this.request(base + this.struct.ui18n.path);
        // lookup ui/blueprint
        this.blueprintentries = await this.request(base + this.struct.blueprint.path);
        // lookup ui/views
        this.viewsentries = await this.request(base + this.struct.views.path);
        // lookup app i18n
        this.i18entries = await this.request(base + this.struct.i18n.path);
        // lookup commands
        this.commandentries = await this.request(base + this.struct.commands.path);
        // lookup queries
        this.querieentries = await this.request(base + this.struct.queries.path);

        // now register
        let ctx = universe.dorifer.context(this.descriptor.id);
        let app = new ThoregonApplication(this.descriptor.id);
        let ui;
        if (thoregon.ui && this.uientries) ui = this.buildAppElement(this.descriptor.id, base + this.struct.ui.path);

        ctx.addAppDefault(app, ui);

        // if there is a ui add the path
        // todo [OPEN]: the 'views' and 'blueprint' locations may be overridden by the component descriptor
        if (this.uientries) ctx.withUI(base + this.struct.ui.path);

        if (this.commandentries) {
            await this.commandentries.entries.aForEach(async (entry) => {
                try {
                    let module  = await import(base + this.struct.commands.path + '/' + entry);
                    let command = module.default;
                    let id      = command.id || asEntityIdentifier(entry);
                    ctx.addCommand(id, command);
                } catch (e) {
                    this.logger.error("Can't load Command", e);
                }
            })
        }

        if (this.querieentries) {
            await this.querieentries.entries.aForEach(async (entry) => {
                try {
                    let module = await import(base + this.struct.queries.path + '/' + entry);
                    let query  = module.default;
                    let id     = query.id || asEntityIdentifier(entry);
                    ctx.addQuery(id, query);
                } catch (e) {
                    this.logger.error("Can't load Query", e);
                }
            })
        }
    }

    buildAppElement(name, base) {
        let element = class DefaultAppElement extends AppElement {
            static get elementTag() {
                return name;
            }

            get uiBase() {
                return base;
            }

            get appliedTemplateName() {
                return 'blueprint';
            }
        }
        element.defineElement();
        return element;
    }

    async request(path) {
        try {
            let res = await fetch(path);
            if (res.status !== 200) return;
            let text = await res.text();
            return JSON.parse(text);
        } catch (ignore) { }    // skip anyways if not found
    }

    /**
     * get the app instance
     * either from the provides class
     * or a parameterized ThoregonApplication
     */
    get app() {

    }

    /**
     * get the app custom UI element
     * either from the provided class
     * of a parameterized AuroraApp
     */
    get ui() {

    }

    /**
     * this is the blueprint (layout) of the app itself
     */
    get blueprint() {

    }

    get commands() {

    }

    get queries() {

    }

}
