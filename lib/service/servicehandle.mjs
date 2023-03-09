/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { isClass, isString, isObject, className } from "/evolux.util";
import { doAsync }                                from "/evolux.universe";

import ThoregonEntity  from "/thoregon.archetim/lib/thoregonentity.mjs";
import EntityResolver  from "/thoregon.archetim/lib/entityresolver.mjs";
import MetaClass       from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import Facade          from "/thoregon.crystalline/lib/facade.mjs";
import NeulandConsumer from "/thoregon.crystalline/lib/consumers/neulandconsumer.mjs";
import NeulandProducer from "/thoregon.crystalline/lib/producers/neulandproducer.mjs";
import Directory       from "/thoregon.archetim/lib/directory.mjs";

export class ServiceHandleMeta extends MetaClass {

    initiateInstance() {
        this.name = "ServiceHandle";
        // this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.boolean('active', { description: 'is the service active', defaultValue: true });

        this.text('source',     { description: "source where to request a queue", mandatory: true });
        this.text('apiQuery',   { description: "when true, the producer supports querying it's API", defaultValue: true } )
        this.text('spec',       { description: "contains the specification for the service. consumer can see information about the producer" });
        this.text('api',        { description: "the producer's API. if empty the consumer can query the API" } )
        this.text('producer',   { description: "contains settings to create the producer. encrypted by the service provider" });
        this.text('instance',   { description: "app instance id if bound to", mandatory: false });

        this.collection('settings', Directory, { description: "contains settings for the producer." });
    }

}

export default class ServiceHandle extends EntityResolver(ThoregonEntity()) {

    /**
     *
     * @param { String | Class | Producer } producer ... a repository reference or a class or an object which is the produce
     * @param { String } source ... where in the universe is the request source for a queue
     * @param { String } identifier ... if the producer is passed as instance (object) there should be an identifier which producer
     * @return {Promise<ServiceHandle>}
     */
    static async forProducer(producer, source, identifier) {
        const handle = new this();
        handle.source = source ?? universe.random();
        return await handle.withProducer(producer, identifier);
    }

    //
    // EntityResolver impl
    //

    async resolveEntity() {
        // distinguish between consumer and producer
        // its the producer side when the 'producer' reference can be decrypted

    }

    //
    // producer provider encryption
    //


    //
    // producer
    //

    async withProducer(producer, identifier) {
        let ref;
        if (isClass(producer)) {
            ref = dorifer.origin4cls(producer);
            if (!ref) ref = identifier ? identifier : 'a producer';
        } else if (isObject(producer)) {
            ref = identifier ?? className(producer)
        } else if (!isString(producer)) {
            throw ErrIllegalArgument(`producer must me a class or a class reference to a repo: '${producer}'`);
        } else {
            ref = producer;     // should be a repo reference
        }

        const { encrypt } = await this.getCrypto();
        const spec        = await encrypt({ c: ref });
        this.spec         = spec;
        return this;
    }

    // todo [REFACTOR]: move to a repository utility
    async makeProducer(reference) {
        let Producer;
        let Module;
        if (reference.startsWith('repo:')) {
            let ref = reference.substring(5);
            Module = (await import(ref))
            let i = reference.lastIndexOf(':');
            if (i > -1) {
                const classname = reference.substring(i+1);
                Producer = Module[classname];
            }
            if (!Producer) {
                // should check: Module.default.name === classname
                Producer = Module.default;
            }
        } else {
            Producer = await this.createProducerInstance(reference);
        }
        return Producer ? new Producer() : undefined;
    }

    createProducerInstance(reference) {
        // implement by subclass
    }

    async ensureSource(spec) {
        if (spec.source) {
            this.source = spec.source;
            await doAsync();
            return;
        }
        let source = await this.source;
        if (source) return;
        this.source = universe.random();
    }
    //
    // get endpoints
    //
    async consumer() {
        if (this._consumer) return this._consumer;
        const srvroot  = await this.source;
        if (!srvroot) return;   // can't request a queue
        const consumer = await Facade.use(await NeulandConsumer.at(srvroot));
        this._consumer = consumer;
        return consumer;
    }

    isProducerLocal(name) {
        if (!universe.agent) return false;
        return agent.current.hasProducer(name);
    }

    /**
     *
     * @param {Class} [Producer]
     * @return {Producer}
     */
    async producer(Producer) {
        if (this._producer) return this._producer;
        let producer;
        if (!Producer) {
            const { decrypt } = await this.getCrypto();
            const { c }       = await decrypt(await this.spec);
            producer          = await this.makeProducer(c);
            if (!producer) return;      // should throw?
        } else {
            producer = new Producer();
        }
        let srvroot    = await this.source;
        const worker   = await NeulandProducer.with(srvroot, producer);
        this._producer = worker;
        return worker;
    }
}

ServiceHandle.checkIn(import.meta, ServiceHandleMeta);
