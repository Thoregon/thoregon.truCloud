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

    constructor(id) {
        super();
        this.id         = id;
        this._producers = {};
        this._consumers = {};
        this._errors    = [];
    }

    static for(id) {
        const instance = new this(id);
        return instance;
    }

    //
    // set defaults
    //
    async init() {
        // create all directories for the SSI
        // todo [REFACTOR]: remove init after 'autocomplete' works
        if (!(await this.collections))  this.collections  = await Directory.create();
        if (!(await this.repositories)) this.repositories = await Directory.create();
        if (!(await this.services))     {
            this.services     = await Directory.create();
        }
    }

    // todo [REFACTOR]
    //  introduce install scrips for agents
    //  setup should only start installed services

    async setup(specs) {
        await this.init();

        const services     = await this.services;
        await timeout(500);
        const servicenames = Object.keys(specs.services);
        const currentnames = [...services.propertyNames];
        // const deactivate   = currentnames.filter((name) => !servicenames.includes(name));
        const create       = servicenames.filter((name) => !currentnames.includes(name));
        const activate     = currentnames.filter((name) => servicenames.includes(name));

        // await this.deactivateServices(deactivate, services);
        let producers = await this.activateServices(activate, specs, services);
        producers = [...producers, ...await this.createServices(create, specs, services)];

        // init producers
        for await (const { name, producer, consumer, spec } of producers) {
            const instance = spec.instance;
            const settings = spec.settings;
            try {
                await consumer.init?.({ instance, settings });
                await consumer.run?.();
            } catch (e) {
                console.error("AgentInstance.setup", e);
                this._errors.push(e);
            }
        }

        // establish the mesh
        for await (const { name, producer, spec } of producers) {
            // const settings = spec.settings;
            if (spec && spec.mesh) await this._discoverProducerPeers(producer, spec.mesh);
        }

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

    async createServices(names, specs, services) {
        const producers = [];
        for await (const name of names) {
            try {
                const spec     = specs.services[name];
                const Producer = spec.producer;         // todo [REFACTOR]: allow also repo references
                const source   = spec.source;
                let producer;
                if (source) {
                    // in case of a request Q source create a service handle in the agents service directory
                    const handle = await ServiceHandle.forProducer(Producer, source);
                    // if a root
                    if (spec.root) {

                    }
                    // utilize instance (id) if defined
                    if (spec.instance) handle.instance = spec.instance;
                    if (spec.settings) {
                        handle.settings = new Directory();      // settings are persistent, create & assign it
                        spec.settings   = await handle.settings;
                        Object.assign(handle.settings, spec.settings);
                    }
                    services[name] = handle;
                    const wrapped  = await handle.producer(spec.producer);
                    producer       = wrapped.service;
                } else {
                    // if not public, just create a local producer
                    producer = new Producer();
                }
                if (producer) {
                    const consumer = await this.withProducer(name, producer);
                    producers.push({ name, producer, consumer, spec });
                }
            } catch (e) {
                console.error("AgentInstance.createServices", e);
                this._errors.push(e);
            }
        }
        return producers;
    }

    async activateServices(names, specs, services) {
        const producers = [];
        for await (const name of names) {
            try {
                const spec     = specs.services[name];
                const handle   = await services[name];
                const settings = spec.settings ?? {};
                if (handle) {
                    const active = await handle.active;
                    if (active) {
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
                            producers.push({ name, producer, consumer, spec });
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
        const consumer = AccessObserver.observe(producer); // wrapping with a Facade seems to be too much overhead -> await Facade.use(await JSProvider.with(producer));
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

// Deactivate can not be done by this instance
//    async deactivateServices(names, services) {
//    }

}

AgentInstance.checkIn(import.meta, AgentInstanceMeta);
