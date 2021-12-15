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
import { ATTRIBUTE_MODE } from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

export class AgentInstanceMeta extends MetaClass {

    initiateInstance() {
        this.name = "AgentInstance";
        // this.attributeMode = ATTRIBUTE_MODE.VARENCRYPT;     // can

        this.text('id');
        this.collection("collections",  Directory, { autocomplete: true });
        this.collection("repositories", Directory, { autocomplete: true });
        this.collection("services",     Directory, { autocomplete: true });

        this.object("device", "Device", { persistent: false });
    }

}

export default class AgentInstance extends ThoregonEntity() {

    constructor(id) {
        super();
        this.id = id;
    }

    static for(id) {
        const instance = new this(id);
        return instance;
    }

    //
    // set defaults
    //
    async init() {
        // create all directories for the SSI
        // todo [REFACTOR]: remove init after 'autocomplete' works
        if (!(await this.collections))  this.collections  = await Directory.create();
        if (!(await this.repositories)) this.repositories = await Directory.create();
        if (!(await this.services))     this.services     = await Directory.create();
    }

}

AgentInstance.checkIn(import.meta, AgentInstanceMeta);
