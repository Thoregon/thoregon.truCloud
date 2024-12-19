/*
 *
 * @author: Martin Neitz, Bernhard Lukassen
 */

import MetaClass           from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import ThoregonEntity      from "/thoregon.archetim/lib/thoregonentity.mjs";
import Directory           from "/thoregon.archetim/lib/directory.mjs";
import Collection          from "/thoregon.archetim/lib/collection.mjs";
import FileSource          from "./filesource.mjs";

// import { ATTRIBUTE_MODE } from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

class UnifiedFileDescriptorMeta extends MetaClass {

    initiateInstance() {
        this.name                     = "UnifiedFileDescriptor";
        // this.attributeMode            = ATTRIBUTE_MODE.VARENCRYPT;

        this.text("name", { description: 'name of the file', mandatory: true });
        this.text("uri", { description: 'uri', mandatory: true });
        this.text("mimetype", { description: 'Mime Type of the file', mandatory: true });
        this.text("description", { description: 'optional description' });
    }

}

export default class UnifiedFileDescriptor extends ThoregonEntity() {

    static get ufd() { return true; }


    //
    // Content
    //

    getObjectURL() {
        let url = this.getURL();
        if (!url.startsWith('http')) url = `https://${universe.account.domain}${url}`;
        return url;
    }

    getURL() {
        return this.uri;
    }

    async getDataUrl() {
        const uri = this.uri;
        if (!uri) return;
        return await mediathek.getDataUrlForURI(uri);
    }
}

export class UnifiedFolderDescriptor extends UnifiedFileDescriptor {

}

UnifiedFileDescriptor.checkIn(import.meta, UnifiedFileDescriptorMeta);

if (globalThis.universe) universe.$UnifiedFileDescriptor = UnifiedFileDescriptor;
