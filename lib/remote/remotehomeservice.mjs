/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { Service, Attach } from "/thoregon.truCloud";
import JSInspector         from "/thoregon.archetim/lib/reflect/jsinspector.mjs";

const NON_REMOTE_METHODS = new Set(['initTranslations', 'getTranslator'])

"@Service"
export default class RemoteHomeService {

    "@Attach"
    async attach(handle, appinstance, home) {
        this.handle   = handle;
        this.instance = appinstance;
        this.home     = home;
        this._numbers = undefined;
        console.log(">> RemoteHomeService", appinstance.qualifier);
    }

    getAppInstanceSpec() {
        const homeschema = JSInspector.schemaFrom(this.home);   // todo: no methods from ExtendedHome!!
        const methods    = homeschema.methods;
        const spec       = {
            appid   : app.current.appid,
            id      : app.current.id,
            services: this.instance.api.ws?.map(({ name, service }) => name) ?? [],      // Object.keys(this.instance.services)
            rest    : this.instance.api.rest?.map(({ name, service }) => name) ?? [],    // ['upaymecheckout', 'heartbeat'],  // todo
            channels: this.home.channels.channelNames,
            home    : Object.keys(methods).filter((name) => !NON_REMOTE_METHODS.has(name)),
        }

        return spec;
    }

    async invokeHome(mthname, params) {
        // console.log(".. RemoteHomeService", mthname, params);
        return params
                ? this.home[mthname](...params)
                : this.home[mthname]();
    }
}