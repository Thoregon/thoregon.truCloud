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

import { isClass }    from "/evolux.util/lib/serialize.mjs"

//
// constants
//

const APPINSTANCE_RETRY_INTERVAL = 2000;

const DBGID = ':: AgentInstance';

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
    }

    static for(id) {
        universe.debuglog(DBGID, "NEW", id);
        const instance = this.create({ id });
        return instance;
    }

    //
    // set defaults
    //
    async init() {
        // create all directories for the SSI
        // todo [REFACTOR]: remove init after 'autocomplete' works
/*
        if (!(await this.collections))  this.collections  = await Directory.create();
        if (!(await this.repositories)) this.repositories = await Directory.create();
        if (!(await this.services))     {
            this.services     = await Directory.create();
        }
*/
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
        this.applySpecs(specs);

        const agentservices = this.services;
        // await timeout(1000);

        //
        // testcol.put(universe.random(), { x: universe.random() });
        //

        const servicenames = Object.keys(specs.services);
        const currentnames = [...agentservices.$keys];
        // const deactivate   = currentnames.filter((name) => !servicenames.includes(name));
        const create       = servicenames.filter((name) => !currentnames.includes(name));
        const activate     = currentnames.filter((name) => servicenames.includes(name));

        this.createServices(create);
        this.activateServices([...create, ...activate], specs.services, agentservices);
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
            if (serviceHandle.needsAppinstance()) {
                this.activateWhenAppinstanceAvailable(name, specs[name], serviceHandle);
            } else {
                this.activateService(name, specs[name], serviceHandle);
            }
        })
    }

    async activateService(name, spec, serviceHandle) {
        try { // const producerref = serviceHandle.producerref;
            universe.debuglog(DBGID, "activate service", name);
            const Producer = spec.producer;
            if (!Producer) return;
            const appname     = serviceHandle.app;
            const instanceid  = serviceHandle.instance;
            const appinstance = me.apps?.[appname]?.[instanceid];
            if (!appinstance) {
                console.log("Required appinstance not found", `${appname}.${instanceid}`);
                return;
            }
            const appservices = appinstance.services;
            if (!(name in appservices)) appservices.put(name, serviceHandle);
            // const producer       = new Producer();
            // const wrapped        = await serviceHandle.producer(Producer);
            const source         = serviceHandle.source;
            const producer       = source ? universe.mq.addProducer(source, new Producer()) : new Producer(); // wrapped.service;
            let hooks            = { oninstall, onattach, onactivate, ondeactivate, onuninstall, ...spec.hooks };
            const clsannotations = dorifer.clsAnnotations(Producer);
            if (clsannotations?.Service) {
                const service = clsannotations.Service.handler;
                // override hooks defined by annotations
                hooks         = { ...hooks, ...service.hooks() };
            }

            let home;
            if (appinstance && spec.home) {
                const Home       = spec.home;
                appinstance.home = home = new Home(appinstance);
            }
            const consumer = await this.withProducer(name, producer);
            const decorated = this.decoratedProducer(producer, spec);   // todo [OPEN]: add hook declaration for service decorators
            // todo [OPEN]: service 'oninstall' hook
            await hooks.onattach(producer, serviceHandle, appinstance, home);
            if (decorated !== producer) await onattach(decorated, serviceHandle, appinstance, home);

            await hooks.onactivate(producer);
            if (decorated !== producer) await onactivate(decorated);
            universe.debuglog(DBGID, "activate service DONE", name);
        } catch (e) {
            universe.debuglog(DBGID, "ERROR: activate service", name);
            console.error("AgentInstance.activateService", name, e.stack ? e.stack : e);
            this._errors.push(e);
        }
    }



    activateWhenAppinstanceAvailable(name, spec, serviceHandle) {
        const apps            = me.apps;
        const appinstancepath = serviceHandle.getAppinstancePath();
        // todo [REFACTOR]: get rid of polling, use 'when exists' callback
        const appinstance     = apps?.[serviceHandle.app]?.[serviceHandle.instance];
        if (appinstance == undefined) {
            setTimeout(((name, spec, serviceHandle) => {
                console.log("...waiting for app", name);
                return () => this.activateWhenAppinstanceAvailable(name, spec, serviceHandle);
            })(name, spec, serviceHandle), APPINSTANCE_RETRY_INTERVAL);
        } else {
            this.activateService(name, spec, serviceHandle);
        }
    }

    async setup_(specs) {
        await this.init();
        this.applySpecs(specs);

        const services = this.services;
        const apps     = me.apps;
        const devices  = me.devices;
        const testcol  = me.test;
        await timeout(1000);

        //
        testcol.put(universe.random(), { x: universe.random() });
        //

        const servicenames = Object.keys(specs.services);
        const currentnames = [...services.$keys];
        // const deactivate   = currentnames.filter((name) => !servicenames.includes(name));
        const create       = servicenames.filter((name) => !currentnames.includes(name));
        const activate     = currentnames.filter((name) => servicenames.includes(name));

        // await this.deactivateServices(deactivate, services);
        let producers = await this.activateServices_(activate, specs, services);
        producers = [...producers, ...await this.createServices_(create, specs, services)];

        // init producers
        for await (let { name, producer, consumer, spec, handle, appinstance, hooks } of producers) {
            const settings = spec.settings;
            try {
                const clsannotations = dorifer.clsAnnotations(producer.constructor);
                if (clsannotations?.Service) {
                    const service = clsannotations.Service.handler;
                    // override hooks defined by annotations
                    hooks = { ...hooks, ...service.hooks() };
                }

                let home;
                if (appinstance && spec.home) {
                    const Home = spec.home;
                    appinstance.home = home = new Home(appinstance);
                }

                const decorated = this.decoratedProducer(producer, spec);   // todo [OPEN]: add hook declaration for service decorators

                // add schedulers if required
                if (create.includes(name)) {
                    await hooks.oninstall(producer, settings);
                    if (decorated !== producer) await oninstall(decorated, settings);
                }

                await hooks.onattach(producer, handle, appinstance, home);
                if (decorated !== producer) await onattach(decorated, handle, appinstance, home);

                await hooks.onactivate(producer);
                if (decorated !== producer) await onactivate(decorated);
            } catch (e) {
                console.error("AgentInstance.setup", e.stack ? e.stack : e);
                this._errors.push(e);
            }
        }

        // establish the mesh
        for await (const { name, producer, spec } of producers) {
            // const settings = spec.settings;
            if (spec && spec.mesh) await this._discoverProducerPeers(producer, spec.mesh);
        }

    }

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

    // todo [REFACTOR]:
    //  also local services should be in the agents service directory
    //  they does not listen to a request Q, they are only available within the agent
    //  tools must it must be able to install and manage also local services (producers)

    async createServices_(names, specs, services) {
        const producers = [];
        for await (const name of names) {
            try {
                const spec                           = specs.services[name];
                const Producer                       = spec.producer;         // todo [REFACTOR]: allow also repo references
                let { source, app, instance, hooks } = spec;
                let producer, handle;
                hooks                                = { oninstall, onattach, onactivate, ondeactivate, onuninstall, ...hooks };   // provide default hooks if missing
                if (!source && app && instance) source = universe.random();
                if (source) {
                    // in case of a request Q source create a service handle in the agents service directory
                    handle = await ServiceHandle.forProducer(Producer, source);
                    // if a root
                    if (spec.root) {

                    }
                    // utilize instance (id) if defined
                    if (spec.instance) handle.instance = spec.instance;
                    if (spec.settings) {
                        handle.settings = Directory.create();      // settings are persistent, create & assign it
                        spec.settings   = await handle.settings;
                        Object.assign(handle.settings, spec.settings);
                    }
                    await services.put(name, handle);
                    const wrapped  = await handle.producer(spec.producer);
                    producer       = wrapped.service;
                } else {
                    // if not public, just create a local producer
                    producer = new Producer();
                }
                if (producer) {
                    const consumer = await this.withProducer(name, producer);
                    const producerspec = { name, producer, consumer, spec, hooks };
                    if (app && instance && handle) {
                        producerspec.handle = handle;
                        const appinstance = await me.apps?.[app]?.[instance];
                        if (appinstance) {
                            const services = await appinstance.services;
                            await services.put(name, handle);
                            producerspec.appinstance = appinstance;
                            producers.push(producerspec);
                        } else {
                            console.log(`Service can not be added to missing app instance: ${app}->${instance}`);
                        }
                    }
                }
            } catch (e) {
                console.error("AgentInstance.createServices", e);
                this._errors.push(e);
            }
        }
        return producers;
    }

    async activateServices_(names, specs, services) {
        const producers = [];
        for await (const name of names) {
            try {
                const spec                   = specs.services[name];
                let { app, instance, hooks } = spec;
                const handle                 = await services[name];
                const settings               = spec.settings ?? {};
                hooks                        = { oninstall, onattach, onactivate, ondeactivate, onuninstall, ...hooks };   // provide default hooks if missing
                if (handle) {
                    const active = await handle.active;
                    if (active) {
                        await handle.ensureSource(spec);
                        const wrapped  = await handle.producer(spec.producer);
                        const producer = wrapped.service;
                        if (producer) {
                            spec.settings = await handle.settings;          // settings are persistent, assign it
                            if (!spec.settings) {
                                handle.settings = new Directory();      // settings are persistent, create & assign it
                                spec.settings   = await handle.settings;
                                Object.assign(handle.settings, settings);
                            }
                            const consumer = await this.withProducer(name, producer);
                            const producerspec = { name, producer, consumer, spec, hooks };
                            if (app && instance && handle) {
                                producerspec.handle = handle;
                                const appinstance = await me.apps?.[app]?.[instance];
                                if (appinstance) producerspec.appinstance = appinstance;
                            }
                            producers.push(producerspec);
                        }
                    }
                }
            } catch (e) {
                console.error("AgentInstance.activateServices", e);
                this._errors.push(e);
            }
        }
        return producers;
    }

    async withProducer(name, producer) {
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
