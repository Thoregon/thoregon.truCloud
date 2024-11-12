/**
 * Agent instance
 *
 * todo
 *  - [OPEN]: add 'shutdown' or 'atDusk' hook to stop services/producers
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { doAsync, timeout } from "/evolux.universe";

import ThoregonEntity from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass      from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import Directory      from "/thoregon.archetim/lib/directory.mjs";
import ServiceHandle  from "../service/servicehandle.mjs";
import AccessObserver from "/evolux.universe/lib/accessobserver.mjs";
import RESTDecorator  from "/evolux.web/lib/annotations/restdecorator.mjs";
import Channel        from "/thoregon.archetim/lib/localmq/channel.mjs";
import ChannelHistory from "/thoregon.archetim/lib/localmq/channelhistory.mjs";
import AgentTerminal  from "./agentterminal.mjs";
import AppInstance    from "../application/appinstance.mjs";
import WSProducer     from "/thoregon.crystalline/lib/producers/wsproducer.mjs";
import RestProducer   from "/thoregon.crystalline/lib/producers/restproducer.mjs";

// import { isClass }    from "/evolux.util";

//
// constants
//

const APPINSTANCE_RETRY_INTERVAL = 2000;
const APP_SYNC_INTERVAL          = 30000;

const DBGID = ':: AgentInstance';

//
// interfaces
//

// const DB   = () => universe.neulandlocal /*?? universe.neuland*/;

//
// service/producer lifecycle functions
//

async function oninstall(service, settings) {
    await service.init?.(settings);
}

async function onattach(service, handle, appinstance, home) {
    await service.attach?.(handle, appinstance, home);
}

async function onactivate(service) {
    await service.activate?.();
}

async function ondeactivate(service) {
    await service.deactivate?.();
}

async function onuninstall(service) {
    try { await service.deactivate?.() } catch(ignore) {};
    await service.quit?.();
}

//*************************************

export class AgentInstanceMeta extends MetaClass {

    initiateInstance() {
        this.name = "AgentInstance";
        // this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.text('id');
        this.collection("collections",  Directory, { autocomplete: true });
        this.collection("repositories", Directory, { autocomplete: true });
        this.collection("services",     Directory, { autocomplete: true });

        this.object("device",    "Device", { persistent: false });
        // this.object("producers", "Object", { persistent: false });
    }

}

export default class AgentInstance extends ThoregonEntity() {

    constructor(/*id*/) {
        super();
        // this.id            = id;
        this._servicespecs = {};
        this._producers    = {};
        this._consumers    = {};
        this._errors       = [];

        this._channels     = {};
        this._histories    = {};

        this._ready        = false;
    }

    static for(id) {
        universe.debuglog(DBGID, "NEW", id);
        const instance = this.create({ id });
        return instance;
    }

    get ready() {
        return this._ready;
    }

    //
    // set defaults
    //
    async init() {
        // create all directories for the SSI
        if (!this.id) this.id = agent.id;
        // todo [REFACTOR]: remove init after 'autocomplete' works
/*
        if (!(await this.collections))  this.collections  = await Directory.create();
        if (!(await this.repositories)) this.repositories = await Directory.create();
        if (!(await this.services))     {
            this.services     = await Directory.create();
        }
*/
    }

    get terminalid() {
        return `${this.id}T`;
    }

    //
    // Channels
    //

    async applyChannels(specs) {
        const channels = specs.channels;
        if (!channels) return;
        const entries = Object.entries(channels);
        for await (let [name, spec] of entries) {
            // load or create local channels
            let channel = await this.loadChannel(name);
            if (!channel) {
                channel = this.createChannel(name, spec);
                await channel.store();
                // this.storeChannel(channel);
            }
            this._channels[name] = channel;

            // persistence -> moved to Channel
            // channel._save = (channel) => { this.saveChannel(channel) };

            // add providers to app channels
            // there is only the information where (agent) to find the channel
            this.linkChannel(name, channel, spec);
        }
    }

    linkChannel(name, channel, spec) {
        const app = this._app.current;
        if (!app) return;

        const terminalid  = this.terminalid;
        const description = spec.description;
        let channels   = app.channels;
        if (channels.has(name)) {
            const channeldef = channels[name];
            // correct data
            if (channeldef.agent !== terminalid)        channeldef.agent = terminalid;
            if (channeldef.name !== name)               channeldef.name = name;
            if (channeldef.description !== description) channeldef.description = description;
        } else {
            channels[name] = { agent: terminalid, name, description };
        }
    }

    getChannel(name) {
        return this._channels[name];
    }

    async loadChannel(name) {
        const channel = await Channel.load(name);
        return channel;
    }

/*
    _old_loadChannel(name) {
        try {
            const agentid = this.id;
            const key     = `${agentid}.channels.${name}`;
            const raw     = DB().get(key);
            if (!raw) return;
            const obj     = universe.util.txdeserialize(raw, { skipThoregon: true }).obj
            const channel = Channel.from(obj);
            return channel;
        } catch (e) {
            console.error(e);
        }
    }
*/

    createChannel(name, spec) {
        const channel = Channel.create(name, spec);
        return channel;
    }

/*
    storeChannel(channel) {
        const agentid = this.id;
        const key     = `${agentid}.channels.${channel.name}`;
        const raw     = universe.util.txserialize(channel);
        DB().set(key, raw);
    }

    saveChannel(channel) {
        // todo [REFACTOR]: introduce delay to handle very frequent events sent to the channel
        this.storeChannel(channel);
    }
*/

    //
    // Channel Histories
    //

    async getHistory(servicename, channelname) {
        let name = `${servicename}.${channelname}`;
        let history = this._histories[name];
        if (history) {
            // history._save = (history) => { this.storeHistory(history) };
            return history;
        }
        this._histories[name] = history = await this.loadHistory(servicename, channelname);
        if (history) {
            // history._save = (history) => { this.storeHistory(history) };
            return history;
        }
        this._histories[name] = history = this.createHistory(servicename, channelname);
        await history.store();
        // this.storeHistory(history);
        // history._save = (history) => { this.storeHistory(history) };

        return history;
    }

    async loadHistory(servicename, channelname) {
        const history = await ChannelHistory.load(servicename, channelname);
        return history;
    }

/*
    _old_loadHistory(servicename, channelname) {
        const agentid = this.id;
        let name = `${servicename}.${channelname}`;
        const key     = `${agentid}.histories.${name}`;
        const raw     = DB().get(key);
        if (!raw) return;
        const obj     = universe.util.txdeserialize(raw, { skipThoregon: true }).obj
        const history = ChannelHistory.from(obj);
        return history;
    }
*/

    createHistory(servicename, channelname) {
        const history = ChannelHistory.forChannel({ servicename, channelname });
        return history;
    }

/*
    storeHistory(history) {
        const agentid = this.id;
        let name = `${history.servicename}.${history.channelname}`;
        const key     = `${agentid}.histories.${name}`;
        const raw     = universe.util.txserialize(history);
        DB().set(key, raw);
    }
*/

    //
    // debug & testing
    //

    restartChannels() {
        const channels = this._channels;
        const histories = this._histories;
        Object.entries(channels).forEach(([name, channel]) => channel.clear());
        Object.entries(histories).forEach(([name, history]) => history.restart());
    }

    //
    // App
    //

    async applyApp(specs) {
        if (!specs.app) return this.applyServices(specs);
        const { id, instance, home } = specs.app;
        // todo [REFACTOR]:
        //  - let dorifer activate the app
        //  - use also AppStructure for app meta information
        //  - get info about services from the app
        // await dorifer.activateApp(app.id);
        try {
            const appmodule = 'app.mjs';
            const approot   = `/${id}/${appmodule}`;
            const App       = (await import(approot)).default;
            const app       = new App(id);
            app._import     = '/'+id;
            this._app       = app;
            this._Home      = home;
            this.applyI18N(app);
            universe.global('app', app);
            this.applyWhenAppinstanceAvailable(specs);
        } catch (e) {
            universe.logger.error("AgentInstance: apply App", e);
        }
    }

    // todo [REFACTOR]: provide translator (I18N)
    applyI18N(app) {

    }

    applyWhenAppinstanceAvailable(specs) {
        const apps         = me.apps;
        const appSpec      = specs.app;
        // todo [REFACTOR]: get rid of polling, use 'when exists' callback
        const appid        = appSpec.id;
        const instid       = appSpec.instance;
        const appinstances = apps?.[appid];
        let   appinstance  = appinstances?.[instid];
        if (appinstance == undefined) {
            if (appSpec.create) {
                // app instance missing but should be created
                appinstance = this.createAppInstance(appid, instid);
                this.restartApp(appinstance, instid, appid, specs);
            } else {
                // app instance missing and must not be created -> wait until exists
                console.log("...waiting for app", appSpec.id, appSpec.instance);
                setTimeout(((specs) => {
                    return () => this.applyWhenAppinstanceAvailable(specs);
                })(specs), APPINSTANCE_RETRY_INTERVAL);
            }
        } else {
            this.restartApp(appinstance, instid, appid, specs);
        }
    }

    restartApp(appinstance, instid, appid, specs) {
        if (appinstance.id !== instid) appinstance.id = instid;
        if (appinstance.appid !== appid) appinstance.appid = appid;
        appinstance.restart();
        app.current = appinstance;
        this._keepAppSync_(appinstance);
        this.applyServices(specs);
    }

    createAppInstance(appid, instid) {
        const opt = {};
        const appinstances = this.ensureAppEntry(appid);
        if (instid) opt.id = instid;
        // new instance needed
        const instance      = AppInstance.forApp(this, opt);
        appid               = instance.id;
        const startApp      = appinstances[appid] = instance;
        this.initAppInstance(startApp);
        console.log("Agent: created app instance", appid);
        return instance;
    }

    ensureAppEntry(appid) {
        let apps = me.apps;
        if (!apps) apps = me.apps = Directory.create();
        let   appinstances = apps?.[appid];
        if (!appinstances) {
            const dir = Directory.create();
            apps[appid] = dir;
            appinstances = apps[appid];
        }
        return appinstances;
    }

    initAppInstance(startApp) {

    }

    _keepAppSync_(appinstance) {
//        try { appinstance.restore$()} catch (ignore) { debugger }
//        setTimeout(() => this._keepAppSync_(appinstance), APP_SYNC_INTERVAL);
    }

    applySpecs(specs) {
        if (!specs.services) return;
        universe.debuglog(DBGID, "apply service specs");
        for (const [name, spec] of Object.entries(specs.services)) {
            this._servicespecs[name] = spec;
        }
    }

    // todo [REFACTOR]
    //  introduce install scrips for agents
    //  setup should only start installed services

    async setup(specs) {
        universe.debuglog(DBGID, "setup");
        await this.init();

        await this.applyWWW(specs);
        await this.applyApp(specs);
    }

    async applyWWW(specs) {
        if (!specs.www) return;
        const wwwController = universe.www;
        if (!wwwController) {
            console.log("WWW not available");
            return;
        }

        const dirs = Array.isArray(specs.www) ? specs.www : [specs.www];
        dirs.forEach((dir) => wwwController.addStatic(dir));
    }

    async applyServices(specs) {
        await this.applyChannels(specs);
        this.applySpecs(specs);
        // this.activateAgentTerminal();

        const agentservices = this.services;
        // await timeout(1000);

        //
        // testcol.put(universe.random(), { x: universe.random() });
        //

        const servicenames = Reflect.ownKeys(specs.services);
        const currentnames = [...agentservices.$keys];
        // const deactivate   = currentnames.filter((name) => !servicenames.includes(name));
        const create       = servicenames.filter((name) => !currentnames.includes(name));
        const activate     = currentnames.filter((name) => servicenames.includes(name));

        const allservices = [...create, ...activate];

        this.createServices(create);
        this.activateServices(allservices, specs.services, agentservices);

        if (universe.apirouter) {
            const services = [];
            const rest = [];
            for await (const name of allservices) {
                services.push({ name, service: await WSProducer.with(name, this._producers[name]) });
                if (specs.services[name].settings?.rest) rest.push({ name, service: await RestProducer.with(name, this._producers[name]) });
            }
            services.forEach(({name, service}) => universe.apirouter.addHandler(name, service));
            rest.forEach(({name, service}) => universe.restrouter.addHandler(name, service))
            app.current.api = {
                ws  : services,
                rest: rest
            }
        }

        this._ready = true;
    }

    /**
     * create the services inside the agent
     * add the service to the agents defined services
     *
     * @param names
     * @param specs
     * @returns {Promise<void>}
     */
    createServices(names) {
        const agentservices = this.services;

        names.forEach((servicename) => {
            const servicespec = this._servicespecs[servicename];
            universe.debuglog(DBGID, "create service", servicename);
            const Producer = servicespec.producer;
            // const producerref = isClass(Producer) ? dorifer.origin4cls(Producer): Producer;
            let { source, app, instance } = servicespec;
            const handle = ServiceHandle.with({ source, app, instance/*, producerref*/ });
            agentservices.put(servicename, handle);
        })
    }

    activateServices(names, specs, services) {
        services.forEachEntry(([name, serviceHandle]) => {
            if (!serviceHandle.active) return;
            if (!specs[name]) return;
            this.activateService(name, specs[name], serviceHandle);
        })
    }

/*
    activateAgentTerminal() {
        const terminalid = this.terminalid;
        const terminal = new AgentTerminal(this, terminalid);
        const producer = universe.mq.addProducer(terminalid, terminal);
        const consumer = AccessObserver.observe(producer);
        universe.mq.addConsumer(terminalid, consumer);
    }
*/

    async activateService(name, spec, serviceHandle) {
        try { // const producerref = serviceHandle.producerref;
            universe.debuglog(DBGID, "activate service", name);
            const Producer = spec.producer;
            if (!Producer) return;
            // const appname     = serviceHandle.app;
            // const instanceid  = serviceHandle.instance;
            const handlesettings = serviceHandle.settings;
            Object.entries(spec.settings).forEach(([name, setting]) => {
                handlesettings[name] = setting;
            })
            const appinstance = globalThis.app?.current; // me.apps?.[appname]?.[instanceid];
            // if (!appinstance) {
            //     console.log("Required appinstance not found", `${appname}.${instanceid}`);
            //     return;
            // }
            const appservices = appinstance?.services ?? {};
            if (!(name in appservices)) appservices.put(name, serviceHandle);
            // const producer       = new Producer();
            // const wrapped        = await serviceHandle.producer(Producer);
            let source         = serviceHandle.source;
            if (spec.source && source !== spec.source) source = serviceHandle.source = spec.source;
            const observed       = AccessObserver.observe(new Producer());
            const producer       = /*source ? universe.mq.addProducer(source, observed) :*/ observed; // wrapped.service;
            let hooks            = { oninstall, onattach, onactivate, ondeactivate, onuninstall, ...spec.hooks };
            const clsannotations = dorifer.clsAnnotations(Producer);
            const ServiceAnnotation = clsannotations?.Service ?? clsannotations?.AutomationService;
            if (ServiceAnnotation) {
                const service = ServiceAnnotation.handler;
                // override hooks defined by annotations
                hooks         = { ...hooks, ...service.hooks() };
            }
            if ( /*true || */this._Home && !appinstance.hasHome()) {
                appinstance.useHome(this._Home);
                appinstance?.home?.restart?.();
            }
            let home = appinstance?.home;
            if (ServiceAnnotation) {
                // automation service
                ServiceAnnotation.handler.serve?.(producer, serviceHandle, appinstance, home);
            }
            // if (appinstance && spec.home) {
            //     const Home       = spec.home;
            //     appinstance.home = home = new Home(appinstance);
            // }
            const consumer = this.withProducer(name, producer);
            const decorated = this.decoratedProducer(consumer, spec);
            // if (source) universe.mq.addConsumer(source, consumer);
            // todo [OPEN]: add hook declaration for service decorators
            // todo [OPEN]: service 'oninstall' hook
            await hooks.onattach(consumer, serviceHandle, appinstance, home);
            if (decorated !== consumer) await onattach(decorated, serviceHandle, appinstance, home);

            await hooks.onactivate(consumer);
            if (decorated !== consumer) await onactivate(decorated);
            universe.debuglog(DBGID, "activate service DONE", name);
        } catch (e) {
            universe.debuglog(DBGID, "ERROR: activate service", name);
            console.error("AgentInstance.activateService", name, e.stack ? e.stack : e);
            this._errors.push(e);
        }
    }

    // activateWhenAppinstanceAvailable(name, spec, serviceHandle) {
    //     const apps            = me.apps;
    //     const appinstancepath = serviceHandle.getAppinstancePath();
    //     // todo [REFACTOR]: get rid of polling, use 'when exists' callback
    //     const appinstance     = apps?.[serviceHandle.app]?.[serviceHandle.instance];
    //     if (appinstance == undefined) {
    //         setTimeout(((name, spec, serviceHandle) => {
    //             console.log("...waiting for app", name);
    //             return () => this.activateWhenAppinstanceAvailable(name, spec, serviceHandle);
    //         })(name, spec, serviceHandle), APPINSTANCE_RETRY_INTERVAL);
    //     } else {
    //         this.activateService(name, spec, serviceHandle);
    //     }
    // }

    // async setup_(specs) {
    //     await this.init();
    //     this.applySpecs(specs);
    //
    //     const services = this.services;
    //     const apps     = me.apps;
    //     const devices  = me.devices;
    //     const testcol  = me.test;
    //     await timeout(1000);
    //
    //     //
    //     testcol.put(universe.random(), { x: universe.random() });
    //     //
    //
    //     const servicenames = Reflect.ownKeys(specs.services);
    //     const currentnames = [...services.$keys];
    //     // const deactivate   = currentnames.filter((name) => !servicenames.includes(name));
    //     const create       = servicenames.filter((name) => !currentnames.includes(name));
    //     const activate     = currentnames.filter((name) => servicenames.includes(name));
    //
    //     // await this.deactivateServices(deactivate, services);
    //     let producers = await this.activateServices_(activate, specs, services);
    //     producers = [...producers, ...await this.createServices_(create, specs, services)];
    //
    //     // init producers
    //     for await (let { name, producer, consumer, spec, handle, appinstance, hooks } of producers) {
    //         const settings = spec.settings;
    //         try {
    //             const clsannotations = dorifer.clsAnnotations(producer.constructor);
    //             if (clsannotations?.Service) {
    //                 const service = clsannotations.Service.handler;
    //                 // override hooks defined by annotations
    //                 hooks = { ...hooks, ...service.hooks() };
    //             }
    //
    //             let home;
    //             if (appinstance && spec.home) {
    //                 const Home = spec.home;
    //                 appinstance.home = home = new Home(appinstance);
    //             }
    //
    //             const decorated = this.decoratedProducer(producer, spec);   // todo [OPEN]: add hook declaration for service decorators
    //
    //             // add schedulers if required
    //             if (create.includes(name)) {
    //                 await hooks.oninstall(producer, settings);
    //                 if (decorated !== producer) await oninstall(decorated, settings);
    //             }
    //
    //             await hooks.onattach(producer, handle, appinstance, home);
    //             if (decorated !== producer) await onattach(decorated, handle, appinstance, home);
    //
    //             await hooks.onactivate(producer);
    //             if (decorated !== producer) await onactivate(decorated);
    //         } catch (e) {
    //             console.error("AgentInstance.setup", e.stack ? e.stack : e);
    //             this._errors.push(e);
    //         }
    //     }
    //
    //     // establish the mesh
    //     for await (const { name, producer, spec } of producers) {
    //         // const settings = spec.settings;
    //         if (spec && spec.mesh) await this._discoverProducerPeers(producer, spec.mesh);
    //     }
    //
    // }

    // todo [REFACTOR]: introduce registry for all decorators and an API
    decoratedProducer(producer, spec) {
        const Cls = producer.constructor;
        if (RESTDecorator.hasDecoratorFor(Cls)) {
            return RESTDecorator.forProducer(producer, spec);
        }
        return producer;
    }

    async _discoverProducerPeers(producer, meshdef) {
        const inject =  meshdef.inject ?? 'usePeer';
        for await (const consumername of meshdef.consumers) {
            const consumer = this._consumers[consumername];
            if (!consumer) {
                console.log(`AgentInstance.discoverProducerPeers: required producer '${consumername}' not found`);
            } else try {
                const fn = producer[inject];
                if (!fn) {
                    console.log(`AgentInstance.discoverProducerPeers: can't inject consumer, producer '${producer.constructor.name}' doesn't provide a method '${inject}'`);
                } else {
                    Reflect.apply(fn, producer, [consumername, consumer]);
                }
            } catch (e) {
                console.log('AgentInstance.discoverProducerPeers', e);
            }
        }
    }

    withProducer(name, producer) {
        this._producers[name] = producer;
        const consumer = AccessObserver.observe(producer); // wrapping with a Facade seems to be too much overhead -> await Facade.use(await JSConsumer.with(producer));
        this._consumers[name] = consumer;
        return consumer;
    }

    hasProducer(name) {
        return !! (this._producers?.[name]);
    }

    consumer(name) {
        return this._consumers[name];
    }

    get consumers() {
        return this._consumers;
    }

    get localServices() {
        return this._consumers;
    }

    //
    // shutdown
    //

    async shutdown() {
        const services = this._servicespecs;
        for await (const [name, servicespec] of Object.entries(services)) {
            const hooks = { ondeactivate, ... servicespec.hooks };
            try {
                const consumer = this.consumer(name);
                if (consumer) await ondeactivate(consumer);
            } catch (e) {
                console.error("AgentInstance.shutdown", e);
                this._errors.push(e);
            }
        }
    }

// Deactivate can not be done by this instance
//    async deactivateServices(names, services) {
//    }

}

AgentInstance.checkIn(import.meta, AgentInstanceMeta);
