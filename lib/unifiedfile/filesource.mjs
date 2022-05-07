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
import mediathek         from "./mediathek.mjs";

export class FileSourceMeta extends MetaClass {

    initiateInstance() {
        this.name                     = "FileSource";

        this.text ("uri", { description: 'URI to the resource', mandatory: true } );
        this.text ("credentials", { description: 'credentials id', mandatory: false } );
        this.text ("mimetype", { description: "another mimetype", mandatory: false });
        this.boolean( 'use', { description: 'use this if no source type is specified'});
    }

}

export default class FileSource extends ThoregonEntity() {

    /**
     * forms an URL which can be processed by the service worker to resolve
     * the resource.
     * URI protocols like ipfs:, torrent: or signal: are not natively supported
     * by the browser an therefore will not work
     */
    async getUrl() {
        let uri = await this.uri;
        if (!uri) throw ErrURIMissing();


    }

    async getStorageAdapter() {
        let uri = await this.uri;
        if (!uri) throw ErrURIMissing();
        const adapter = mediathek.getStorageAdapterFor(uri);
    }
}

FileSource.checkIn(import.meta, FileSourceMeta);
