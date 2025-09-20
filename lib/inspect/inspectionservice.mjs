/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */


import { AutomationService, Attach, OnMessage } from "/thoregon.truCloud";

import { isObject, baredeepcopy } from "/evolux.util/lib/objutils.mjs";
import ThoregonDecorator          from "/thoregon.archetim/lib/thoregondecorator.mjs";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

"@AutomationService"
export default class InspectionService {

    "@Attach"
    async attach(handle, appinstance, home) {
        this.handle   = handle;
        this.instance = appinstance;
        this.home     = home;

        console.log(">> InspectionService", appinstance.qualifier);
    }

    /**
     *
     */
    inspect(soul) {
        if (!universe.neuland.has(soul)) return { ok: false };
        const entity = ThoregonDecorator.from(soul);
        const res = {
            ok: true,
            obj: entity.inspect$()
        }
        return res;
    }

    async apply(js, params) {
        try {
            let fn = new AsyncFunction('', `return (${js});`);
            const res = await fn(params);
            return isObject(res) ? baredeepcopy(res) : res;
        } catch (e) {
            return { ok: false, error: e };
        }
    }

}