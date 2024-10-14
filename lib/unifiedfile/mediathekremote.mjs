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
import MediathekBase from "./mediathekbase.mjs";
import UnifiedFileDescriptor from "./unifiedfiledescriptor.mjs";

export default class MediathekRemote extends MediathekBase {

    async createUfd({ uri, filename, mimetype, mediathek }) {
        const ufd =  await app.current.create('UnifiedFileDescriptor', { uri, name: filename, mimetype, mediathek });
        return ufd;
    }

}