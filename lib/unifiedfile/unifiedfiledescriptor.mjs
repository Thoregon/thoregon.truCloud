/*
 *
 * @author: Martin Neitz, Bernhard Lukassen
 */

import MetaClass           from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import ThoregonEntity      from "/thoregon.archetim/lib/thoregonentity.mjs";
import Directory           from "/thoregon.archetim/lib/directory.mjs";
import Collection          from "/thoregon.archetim/lib/collection.mjs";

// import { ATTRIBUTE_MODE } from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

class UnifiedFileDescriptorMeta extends MetaClass {

    initiateInstance() {
        this.name                     = "UnifiedFileDescriptor";
        // this.attributeMode            = ATTRIBUTE_MODE.VARENCRYPT;

        this.text("name", { description: 'name of the file', mandatory: true });
        this.text("description", { description: 'optional description' });
        this.text("mimetype", { description: 'Mime Type of the file', mandatory: true });
        this.image("preview", { embedded: true });
        // this.boolean("isFolder", { description: 'is it a folder', defaultValue: false });
        this.boolean("isArchive", { description: 'is it an archive', defaultValue: false });
        this.text("tags", { description: 'tags for this file' } );
        this.collection("properties", Directory, { embedded: true, description: 'user/app defined properties' } );
        this.collection("sources", Collection, { embedded: true, autocomplete: true, description: 'sources where to find the content, source type is the key' });
    }

}

export default class UnifiedFileDescriptor extends ThoregonEntity() {

    static async withUrl(name, url, mimetype) {
        const cid = universe.random();
        const storage = mediathek.getStorageAdapter('url');
        const source = await storage.createSource(cid, { name, content: url, mimetype, use: true, mediathek: false });

        const ufd = universe.observe(new UnifiedFileDescriptor());
        ufd.name = name;
        ufd.sources = Collection.create();
        ufd.sources.add(source);

        return ufd;
    }

    //
    // Content
    //

    get readStream() {}
    get writeStream() {}

    hasSource() {
        const found = this.sources.find((item) => item.hasUri()) ?? false;
        return !!found;
    }

    getAnySource() {
        const source = this.sources.getAny();
        return source.item;
    }


    getAvailableSource() {
        const source = this.sources.find((item) => item.isAvailable());
        return source;
    }


    getSource() {
        const sources = this.sources;
        if (!sources) return;
        if (sources.length === 1) return this.getAnySource();    // if there is only one source, it is the only that 'getAny()' will find
        let source = sources.find((source) => source.use && !!source.uri);
        if (!source) return this.getAvailableSource();                 // no source is defined to be used, take any
        return source;
    }

    getObjectURL() {
        return this.getURL();
    }

    getURL() {
        const source = this.getSource();
        return source?.getUrl();
    }

    async getDataUrl() {
/*
        if (this.content) {
            const b64 = this.content.substring('$B64$'.length);
            const dataUrl = `data:${this.mimetype};base64,${b64}`;
            return dataUrl;
        }
*/
        const source = this.getSource();
        return source
                ? await mediathek.getDataUrl(source)
                : undefined;
    }
}

export class UnifiedFolderDescriptor extends UnifiedFileDescriptor {

}

UnifiedFileDescriptor.checkIn(import.meta, UnifiedFileDescriptorMeta);

if (globalThis.universe) universe.$UnifiedFileDescriptor = UnifiedFileDescriptor;
