/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import Directory, { DirectoryMeta } from "/thoregon.archetim/lib/directory.mjs";
import { ATTRIBUTE_MODE }           from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

export class SSIMediaDirectoryMeta extends DirectoryMeta {

    initiateInstance() {
        this.name                     = "SSIMediaDirectory";
        this.attributeMode            = ATTRIBUTE_MODE.VARENCRYPT;
        const attributePresets        = this.attributePresets;
        attributePresets.autocomplete = true;
        attributePresets.cls          = SSIMediaDirectory;

        this.collection("cids",  Directory, { autocomplete: true });
        this.collection("tags",  Directory, { autocomplete: true });
        // todo [OPEN]: index for search
    }

    chainAutoComplete(entity) {
        // todo: chain the auto complete for media directories, use options to specify the class to use for the chain
        // return new SSIMediaDirectory();
    }

}

export default class SSIMediaDirectory extends Directory {

    async hasCID(cid) {
        const cids = await this.cids;
        return !! await cids[cid];
    }

    async getCID(cid) {
        const cids = await this.cids;
        return await cids[cid];
    }

    async addCID(cid, ufd) {
        const cids = await this.cids;
        cids[cid] = ufd;
        return ufd;
    }

    async allCIDs() {
        const cids = await this.cids;
        const items = await cid.$keys;
        return items;
    }

}

SSIMediaDirectory.checkIn(import.meta, SSIMediaDirectoryMeta);
