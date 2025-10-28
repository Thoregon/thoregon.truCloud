/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import SEA    from "/evolux.everblack/lib/crypto/sea.mjs";
import baseDB from "/evolux.universe/lib/sovereign/basedb.mjs";

import { ErrAgentsForSSInotAvailable } from "../errors.mjs";
import AgentInstance                   from "./agentinstance.mjs";
import AppInstance                     from "../application/appinstance.mjs";
import { doAsync }                     from "/evolux.universe";
import { isString }                    from "/evolux.util/lib/objutils.mjs";
/*
import fs                              from "/fs";
import path                            from "/path";
*/

const TAGENT = 'tagent';

const SYNC_WAIT_TIMEOUT = 1000;

const DBGID = ':: Agent';


/**********************************************************************************************/
/*const isDirectory = source => fs.existsSync(source) && fs.statSync(source).isDirectory();

const getAgentSetupFiles = (basedir) => {
    let find = /^agent_.*config\.mjs$/;
    if (isDirectory(basedir)) {
        let dircontent = fs.readdirSync(basedir);
        return dircontent.filter(item => item.match(find)).sort().map(filename => path.join(basedir, filename));
    }
    return [];
};*/
/**********************************************************************************************/

const SERVICESPECS = [];

export default class Agent {

    constructor() {
        this._current   = undefined;
        this._instances = [];
        this._hooks     = [];
    }

    static addServiceSpec(spec) {
        SERVICESPECS.push(spec);
    }

    static async awake() {
        console.log(DBGID, "awake");
        const agent = new this();
        await agent.establish();
        console.log(DBGID, "awake DONE");
        return agent;
    }

    get id() {
        return this._id;
    }

    async establish() {
        console.log(DBGID, "establish");
        let id = await baseDB.get(TAGENT);
        if (!id) {
            id = universe.random();
            await baseDB.set(TAGENT, id);
            console.log(DBGID, "establish new Agent", id);
        }
        this._id = id;
        universe.$agent = this;
        universe.global('agent', this);
        console.log(DBGID, "establish DONE");
        return id;
    }

    /**
     * do not override. prepares instances
     */
    async prepare() {
        console.log(DBGID, "prepare");
        if (globalThis.me) return await this.startAgent();
        universe.Identity.addListener('auth', () => this.startAgent());
    }

    async startAgent() {
        // get last used instance
        // select agent root for instance
        console.log(DBGID, "prepare AUTH");
        if (!await this.initAgentInstance()) {
            console.log("** AgentInstance not initialized");
            return null;
        }
        await this.startServices();
        await this.processHooks();
        console.log(DBGID, "prepare AUTH DONE");
        return this._current;
    }

    async startServices() {
        if (!this._current) return;
        // todo [OPEN]
        //  - services defined in agent.current.services
        //  - local installed services -> make avaliable to SSI w/o persitent entry in agent.current.services
    }

    async restart() {
        // implement by subclasses
    }

    addHook(fn) {
        this._hooks.push(fn);
    }

    async processHooks() {
        const hooks = this._hooks;
        this._hooks = [];
        for await (let fn of hooks) {
            try {
                await fn();
            } catch (e) {
                console.error(">> Agent.processHooks", e);
            }
        }
    }

    //
    // instances
    //

    get instances() {
        return this._instanes;
    }

    get current() {
        return this._current;
    }

    set current(appinstance) {
        console.log(">> Set Agent Instance (current)");
        this._current = appinstance;
    }

    async initAgentInstance() {
        if (this._current) return;
        console.log(DBGID, "initAgentInstance");
        // const withUser = await SSI.is;
        // first check if there is a last used, or a 'start with' instance exists
        if (!global.me) {
            // no user for agent instance
            // todo [OPEN]
            debugger;
            console.log(">> Agent Instance: not identity/user defined");
        } else {
            const id     = await this.id;       // id from the anchor
            const agents = await me.agents;
            if (!agents) throw ErrAgentsForSSInotAvailable(id);
            this._instances = agents;
            // get this agent instance
            let instance    = await agents[id];
            if (!instance) {
                console.log(DBGID, "initAgentInstance: not available");
                // if missing initialize an agent instance
                agents[id] = AgentInstance.for(id);
                await doAsync();
                instance = await agents[id];
                await instance.init();
                console.log(DBGID, "initAgentInstance: new instance initialized");
            }
            if (instance.constructor !== AgentInstance) {
                console.log(DBGID, "initAgentInstance: instance is not an AgentInstance");
                return;
            }
            console.log(DBGID, "initAgentInstance: instance setup");
            const setupspecs = await this.getAgentSetup();
            console.log(">> B4Set Agent Instance (current)");
            this._current    = instance;
            console.log(">> Set DONE Agent Instance (current)");
            universe.atDusk(async () => this.shutdownInstance(instance));
            if (!await instance.setup(setupspecs)) {
                console.error("** AgentInstance not initialized");
                return null;
            }
            // console.log(">> Set Agent Instance (current)");
            // this._current    = instance;
            console.log(DBGID, "initAgentInstance: instance setup DONE");
            return instance;
        }
    }

    async shutdownInstance(instance) {
        await instance.shutdown();
    }

    async getAgentSetup() {
        let services  = {};
        let channels  = {};
        let schedules = [];
        let app;
        let www       = [];
        for (const spec of SERVICESPECS) {
            if (!app) app = spec.app;
            let swww = spec.www;
            if (swww) Array.isArray(swww) ? www = [ ...www, ...swww] : isString(swww) ? www.push(swww) : console.log("setup: 'www' is not a String or an Array");
            services = { ...services, ...(spec.services ? spec.services : {}) };
            channels = { ...channels, ...(spec.channels ? spec.channels : {}) };
            if (spec.schedules) schedules.push(spec.schedules);
        }
        return { app, www, channels, services, schedules };
    }

}
