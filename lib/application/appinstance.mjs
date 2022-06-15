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
import Directory          from "/thoregon.archetim/lib/directory.mjs";

export class AppInstanceMeta extends MetaClass {

    initiateInstance() {
        this.name = "AppInstance";
        this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.text('appid');
        this.text('id');
        this.collection('data', Directory, { description: 'app data root'});
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

    // todo [OPEN]:
    //  - introduce structure of the app storeage
    //  - define each path needed for the app
    //  - will be available as short code e.g. app.current.myfriends
    //  - can also contain Queries (Views)
    //  - use as reference in UI

}

AppInstance.checkIn(import.meta, AppInstanceMeta);
