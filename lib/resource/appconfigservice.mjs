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

"@Restfull"
"@Path('etc')"
export default class AppConfigService {


    async attach(handle, appinstance) {
        this.handle   = handle;
        this.instance = appinstance;
        console.log(">> AppConfigService", appinstance.qualifier);
    }


    "@Auth(false)"
    "@Get('account.json')"
    "@Produces({ '.json' })"
    async account({ auth, params, query, content } = {}) {
        try {
            const { alias:name, domain, email, nexus } = universe.account;
            let localhost;
            if (universe.isDev) localhost = `http://${universe.WWW.host}:${universe.WWW.port}`;
            const appconfig = { name, domain, email, nexus, localhost };
            if (universe.isDev) appconfig.anchor = universe.account.anchor;
            if (universe.IS_NEXUS) appconfig.isNexus = true;
            return appconfig;
        } catch(e) {
            console.error(">> AppConfigService: get account.mjs", e);
            throw e;
        }
    }

    // thoregon.isDev
    "@Auth(false)"
    "@Get('dev.json')"
    "@Produces({ '.json' })"
    async dev({ auth, params, query, content } = {}) {
        try {
            return (universe.isDev) ? { dev: true } : {};
        } catch(e) {
            console.error(">> AppConfigService: get account.mjs", e);
            throw e;
        }
    }
}

AppConfigService.checkIn(import.meta);