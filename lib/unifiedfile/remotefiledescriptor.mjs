/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class RemoteFileDescriptor {

    static get ufd() { return true; }

    //
    // Content
    //

    getObjectURL() {
        return this.getURL();
    }

    getURL() {
        return { done: true, params: this.uri };
    }

    getDataUrl() {
        return {
            done: true,
            params: mediathek.getDataUrlForURI(this.uri)
        }
    }


}