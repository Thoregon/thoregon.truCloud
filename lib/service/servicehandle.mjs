/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ThoregonEntity   from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass        from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import Facade           from "/thoregon.crystalline/lib/facade.mjs";
import ThoregonConsumer from "/thoregon.crystalline/lib/providers/thoregonconsumer.mjs";
import ThoregonProducer from "/thoregon.crystalline/lib/services/thoregonproducer.mjs";
import Producer         from "../../../../Puls/test/producer.mjs";

export class ServiceHandleMeta extends MetaClass {

    initiateInstance() {
        this.name = "ServiceHandle";
        // this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.text('source');    // entry to request a queue
        this.object('spec');    // contains the specification for the service. encrypted by the service provider
    }

}

export default class ServiceHandle extends ThoregonEntity() {

    static async forProducer(reference, source) {
        const handle = new this();
        handle.source = source ?? universe.random();
        return await handle.withProducer(reference);
    }

    //
    // producer provider encryption
    //

    static async getCrypto(opt) {
        // $@CRED
        // todo [OPEN]:
        //  - replace with real encryption and signing
        //  - private objects use the identities keys
        //  - shared objects use the keys from identities credentials
        const pubkey = 'SERVICE';
        const encrypt = async ({ p, s, c, ...opt } = {}) => { return { p: p ?? pubkey, c, ...opt } };
        const decrypt = async ({ p, s, c } = {}) => c;
        return { encrypt, decrypt };
    }

    async getCrypto(opt) {
        return await this.constructor.getCrypto(opt);
    }


    //
    // producer
    //

    async withProducer(reference) {
        const { encrypt } = await this.getCrypto();
        const spec        = encrypt({ c: reference });
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
        } else {
            // todo [OPEN]
        }
        let i = reference.lastIndexOf(':');
        if (i > -1) {
            const classname = reference.substring(i+1);
            Producer = Module[classname];
            if (!Producer) {
                // should check: Module.default.name === classname
                Producer = Module.default;
            }
        }
        return Producer ? new Producer() : undefined;
    }

    //
    // get endpoints
    //
    async consumer() {
        const srvroot  = await this.source;
        const consumer = await Facade.use(await ThoregonConsumer.at(srvroot));
        return consumer;
    }

    async producer() {
        const { decrypt } = await this.getCrypto();
        const { c }       = await decrypt(await this.spec);
        const producer    = await this.makeProducer(c);
        if (!producer) return;      // should throw?
        const srvroot     = await this.source;
        const worker    = await ThoregonProducer.with(srvroot, producer);
        return worker;
    }
}

ServiceHandle.checkIn(impor.meta, ServiceHandleMeta);
