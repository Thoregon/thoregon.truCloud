/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import MetaClass         from "/thoregon.archetim/lib/metaclass/metaclass.mjs";
import ThoregonEntity    from "/thoregon.archetim/lib/thoregonentity.mjs";

import { ErrURIMissing } from "../errors.mjs";

export class FileSourceMeta extends MetaClass {

    initiateInstance() {
        this.name                     = "FileSource";

        this.text ("uri", { description: 'URI to the resource', mandatory: true } );
        this.text ("filename", { description: 'filename of the resource', mandatory: false } );
        this.text ("credentials", { description: 'credentials id', mandatory: false } );
        this.text ("mimetype", { description: "another mimetype", mandatory: false });
        this.boolean( 'use', { description: 'use this if no source type is specified. if this is the only source, it will be used also', defaultValue: false});
    }

}

export default class FileSource extends ThoregonEntity() {

    static recreateSource(cid, { filename, mimetype }) {
        const i = filename.lastIndexOf('.');
        let ext;
        if (i > -1) ext = filename.substring(i+1);
        let uri = `${universe.HTTPFILESINK}/${cid}`;
        if (ext) uri +=`.${ext}`;
        const source = FileSource.create({ uri, filename, mimetype });
        return source;
    }

    isAvailable() {
        return this.hasUri();
    }

    hasUri() {
        return !!this.uri;
    }

    /**
     * forms an URL which can be processed by the service worker to resolve
     * the resource.
     * URI protocols like ipfs:, torrent: or signal: are not natively supported
     * by the browser an therefore will not work
     */
    getUrl() {
        let uri = this.uri;
        // if (!uri) throw ErrURIMissing();    // todo [OPEN]: check if necessary
        return uri;
    }

    getStorageAdapter() {
        let uri = this.uri;
        if (!uri) throw ErrURIMissing();
        const adapter = mediathek.getStorageAdapterFor(uri);
    }

}

FileSource.checkIn(import.meta, FileSourceMeta);
