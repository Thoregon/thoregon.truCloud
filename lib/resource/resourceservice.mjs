/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { Service, Attach }                     from "../service/annotations.mjs";
import { Restfull, Auth, Path, Get, Produces } from "/evolux.web";
import fs                                      from "fs/promises";
import path                                    from "path";

const FILEPATH = "resource";
const B64MGK   = '$B64$';
const B64ML    = B64MGK.length;

"@Restfull"
"@Path('resource')"
export default class ResourceService {


    async attach(handle, appinstance) {
        this.handle   = handle;
        this.instance = appinstance;
        console.log(">> ResourceService", appinstance.qualifier);
    }


    "@Auth(false)"
    "@Post('add')"
    "@Produces({ 'Content-Type': 'application/json' })"
    async addResource({ auth, params, query, content } = {}) {
        const body = content;
        try {
            if (!body) {
                console.log('nothing to store');
                return { ok: false,  error: e.stack ?? e.message };
            }

            let { cid, filename, ext , content } = body;
            if (!content) {
                console.log('nothing to store');
                return { ok: false, error: e.stack ?? e.message };
            }
            let _fname = cid;
            if (ext) _fname += '.' + ext;
            if (content.startsWith(B64MGK)) content = Buffer.from(content.substring(B64ML), "base64");    // base64 -> binary
            const targetPath = universe.buildPub(FILEPATH);
            await fs.mkdir(targetPath, { recursive: true });
            await fs.writeFile(path.resolve(targetPath, `${_fname}`), content);
            return { ok: true };
        } catch(e) {
            console.log(">> ResourceService: POST add", e, e.stack);
            return { ok: false,  error: e.stack ?? e.message };
        }
    }
}

ResourceService.checkIn(import.meta);