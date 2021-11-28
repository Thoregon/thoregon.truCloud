/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import ThoregonEntity     from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass          from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import Collection         from "/thoregon.archetim/lib/collection.mjs";
import Directory          from "/thoregon.archetim/lib/directory.mjs";
import { ATTRIBUTE_MODE } from "../../../thoregon.archetim/lib/metaclass/metaclass.mjs";

export class AppInstanceMeta extends MetaClass {

    initiateInstance() {
        this.name = "AppInstance";
        this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.text('appid');
        this.text('id');
    }

}

export default class AppInstance extends ThoregonEntity() {

    static async fromApp(app, opt) {
        const appid = app.id;
        const id = universe.random();
        const instance = await this.create();
        instance.appid = app.is;

    }

}

AppInstance.checkIn(import.meta, AppInstanceMeta);
