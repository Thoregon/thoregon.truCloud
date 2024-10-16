/**
 * Top level (universe wide) object as entry point
 * to unified file descriptors and media services
 *
 * currently the mediathek is attached to an SSI
 *
 * todo:
 *  - introduce also public mediathek items (can be used universe wide by everybody)
 *  - introduce sharable mediatheks which can be used by
 *      - everybody (public access)
 *      - with credential
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */


import UnifiedFileDescriptor           from "./unifiedfiledescriptor.mjs";
import MediathekBase                   from "./mediathekbase.mjs";

export default class Mediathek extends MediathekBase {

    async createUfd({ uri, filename, mimetype, mediathek }) {
        const ufd = await UnifiedFileDescriptor.create({ uri, name: filename, mimetype, mediathek });
        return ufd;
    }

}
