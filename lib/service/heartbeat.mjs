/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { AutomationService, Attach, OnMessage } from "/thoregon.truCloud";

import { crystallize }       from "/evolux.util/lib/serialize.mjs"
import ThoregonDecorator     from "/thoregon.archetim/lib/thoregondecorator.mjs";

"@AutomationService"
export default class HeartBeat {

    "@Attach"
    async attach(handle, appinstance, home) {
        this.handle   = handle;
        this.instance = appinstance;
        this.home     = home;

        console.log(">> HeartBeat", appinstance.qualifier);
    }

    ping(msg) {
        return { ok: true, now: universe.inow, msg: `received ${msg}` }
    }
}