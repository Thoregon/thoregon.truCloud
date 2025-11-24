/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { AutomationService, Attach, OnMessage } from "./annotations.mjs";

import { crystallize }       from "/evolux.util/lib/serialize.mjs"
import ThoregonDecorator     from "/thoregon.archetim/lib/thoregondecorator.mjs";

"@AutomationService"
"@Restfull"
"@Path('heartbeat')"
export default class HeartBeat {

    "@Attach"
    async attach(handle, appinstance, home) {
        this.handle   = handle;
        this.instance = appinstance;
        this.home     = home;

        console.log(">> HeartBeat", appinstance.qualifier);
    }

    ping(msg) {
        return { ok: true, now: universe.nowFormated, msg: `received ${msg}` }
    }

    "@Auth(false)"
    "@Get('')"
    "@Produces({ 'Content-Type': 'application/json' })"
    async restPing({ auth, params, query, content } = {}){
        return { ok: true, now: universe.nowFormated };
    }

}

HeartBeat.checkIn(import.meta);