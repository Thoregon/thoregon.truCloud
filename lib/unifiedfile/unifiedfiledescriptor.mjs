/*
 * Copyright (c) 2022.
 */

/*
 *
 * @author: Martin Neitz
 */

import MetaClass      from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import ThoregonEntity from "/thoregon.archetim/lib/thoregonentity.mjs";
import Directory      from "/thoregon.archetim/lib/directory.mjs";
import Collection     from "/thoregon.archetim/lib/collection.mjs";
import FileSource     from "./filesource.mjs";

// import { ATTRIBUTE_MODE } from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

class UnifiedFileDescriptorMeta extends MetaClass {

    initiateInstance() {
        this.name                     = "UnifiedFileDescriptor";
        // this.attributeMode            = ATTRIBUTE_MODE.VARENCRYPT;

        this.text("name", { description: 'name of the file', mandatory: true });
        this.text("description", { description: 'optional description' });
        this.text("mimetype", { description: 'Mime Type of the file', mandatory: true });
        this.image("preview", );
        // this.boolean("isFolder", { description: 'is it a folder', defaultValue: false });
        this.boolean("isArchive", { description: 'is it an archive', defaultValue: false });
        this.text("tags", { description: 'tags for this file' } );
        this.collection("properties", Directory, { description: 'user/app defined properties' } );
        this.collection("sources", Collection, { description: 'sources where to find the content, source type is the key' });
    }

}

export default class UnifiedFileDescriptor extends ThoregonEntity() {

    //
    // Content
    //

    async store() {

    }

    get readStream() {}
    get writeStream() {}

}

export class UnifiedFolderDescriptor extends UnifiedFileDescriptor {

}

UnifiedFileDescriptor.checkIn(import.meta, UnifiedFileDescriptorMeta);

if (globalThis.universe) universe.$UnifiedFileDescriptor = UnifiedFileDescriptor;
