/**
 *
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
import Facade         from "/thoregon.crystalline/lib/facade.mjs";
import JSProvider     from "/thoregon.crystalline/lib/providers/jsprovider.mjs";

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
        this.id        = id;
        this._producers = {};
        this._consumers = {};
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
        await this.activateServices(activate, specs, services);
        await this.createServices(create, specs, services);
    }

    // todo [REFACTOR]:
    //  also local services should be in the agents service directory
    //  they does not listen to a request Q, they are only available within the agent
    //  tools must it must be able to install and manage also local services (producers)

    async createServices(names, specs, services) {
        for await (const name of names) {
            const spec     = specs.services[name];
            const Producer = spec.producer;         // todo [REFACTOR]: allow also repo references
            const source   = spec.source;
            let producer;
            if (source) {
                // in case of a request Q source create a service handle in the agents service directory
                const handle   = await ServiceHandle.forProducer(Producer, source);
                services[name] = handle;
                producer = await handle.producer(spec.producer);
            } else {
                // if not public, just create a local producer
                producer = new Producer();
            }
            if (producer) {
                await this.withProducer(name, producer);
                await producer.init?.(spec.settings);
            }
        }
    }

    async activateServices(names, specs, services) {
        for await (const name of names) {
            const spec   = specs.services[name];
            const handle = await services[name];
            if (handle) {
                const producer = await handle.producer(spec.producer);
                if (producer) {
                    await this.withProducer(name, producer);
                    await producer.init?.(spec.settings);
                }
            }
        }
    }

    async withProducer(name, producer) {
        this._producers[name] = producer;
        this._consumers[name] = await Facade.use(await JSProvider.with(producer));
    }

    hasProducer(name) {
        return !! (this._producers?.[name]);
    }

    get consumers() {
        return this._consumers;
    }

// Deactivate can not be done by this instance
//    async deactivateServices(names, services) {
//    }

}

AgentInstance.checkIn(import.meta, AgentInstanceMeta);
