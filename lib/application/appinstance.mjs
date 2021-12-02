/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ThoregonEntity     from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass          from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import { ATTRIBUTE_MODE } from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

export class AppInstanceMeta extends MetaClass {

    initiateInstance() {
        this.name = "AppInstance";
        this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.text('appid');
        this.text('id');
    }

}

export default class AppInstance extends ThoregonEntity() {

    static async forApp(app, opt) {
        const appid = app.id;
        const id = opt?.id ?? universe.random(5);
        const instance = new this();
        instance.appid = app.id;
        instance.id = id;
        instance.opt = opt;
        return instance;
    }

}

AppInstance.checkIn(import.meta, AppInstanceMeta);
