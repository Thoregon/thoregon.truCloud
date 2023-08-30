/*
 *
 * @author: Martin Neitz, Bernhard Lukassen
 */

import MetaClass      from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import ThoregonEntity from "/thoregon.archetim/lib/thoregonentity.mjs";
import Directory      from "/thoregon.archetim/lib/directory.mjs";
import Collection     from "/thoregon.archetim/lib/collection.mjs";

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
        this.collection("sources", Collection, { embedded: true, description: 'sources where to find the content, source type is the key' });
    }

}

export default class UnifiedFileDescriptor extends ThoregonEntity() {

    //
    // Content
    //

    get readStream() {}
    get writeStream() {}

    hasSource() {
        return !this.sources.is_empty;
    }

    getAnySource() {
        const source = this.sources.getAny();
        return source.item;
    }

    getSource() {
        const sources = this.sources;
        if (!sources) return;
        if (sources.length === 1) return this.getAnySource();    // if there is only one source, it is the only that 'getAny()' will find
        let source = sources.find((source) => source.use && !!source.uri);
        if (!source) return this.getAnySource();                 // no source is defined to be used, take any
        return source;
    }

    getObjectURL() {
        const source = this.getSource();
        return source?.getUrl();
    }

    async getDataUrl() {
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
