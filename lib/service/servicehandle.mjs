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
        this.text('spec',       { description: "contains the specification for the service. consumer can see information about the producer" });
        this.text('producerref',{ description: "contains settings to create the producer" });
        this.text('app',        { description: "app name if bound to", mandatory: false });
        this.text('instance',   { description: "app instance id if bound to", mandatory: false });

        this.collection('settings', Directory, { description: "contains settings for the producer." });
    }

}

export default class ServiceHandle extends EntityResolver(ThoregonEntity()) {

    static with({ source, app, instance, settings, producerref }  = {}) {
        settings = Directory.create(settings);
        if (!source) source = universe.random();
        const handle = this.create({ source, app, instance, settings, producerref });
        return handle;
    }

    //
    //
    //

    needsAppinstance() {
        return this.app != undefined && this.instance != undefined;
    }

    getAppinstancePath() {
        return `${this.app}.${this.instance}`;
    }

    //
    // producer
    //

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
