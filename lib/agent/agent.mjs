/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import SEA    from "/evolux.everblack/lib/crypto/sea.mjs";
import baseDB from "/evolux.universe/lib/reliant/basedb.mjs";

import { ErrAgentsForSSInotAvailable } from "../errors.mjs";
import AgentInstance                   from "./agentinstance.mjs";
import AppInstance                     from "../application/appinstance.mjs";
import { doAsync }                     from "/evolux.universe";
/*
import fs                              from "/fs";
import path                            from "/path";
*/

const TAGENT = 'tagent';

const SYNC_WAIT_TIMEOUT = 1000;

const DBGID = ':: AgentInstance';


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
    }

    static addServiceSpec(spec) {
        SERVICESPECS.push(spec);
    }

    static async awake() {
        universe.debuglog(DBGID, "awake");
        const agent = new this();
        await agent.establish();
        universe.debuglog(DBGID, "awake DONE");
        return agent;
    }

    get id() {
        return this._id;
    }

    async establish() {
        universe.debuglog(DBGID, "establish");
        let id = await baseDB.get(TAGENT);
        if (!id) {
            id = universe.random();
            await baseDB.set(TAGENT, id);
            universe.debuglog(DBGID, "establish new Agent", id);
        }
        this._id = id;
        universe.agent = this;
        universe.global('agent', this);
        universe.debuglog(DBGID, "establish DONE");
        return id;
    }

    /**
     * do not override. prepares instances
     */
    async prepare() {
        universe.debuglog(DBGID, "prepare");
        universe.Identity.addListener('auth', async (identity) => {
            // get last used instance
            // select agent root for instance
            universe.debuglog(DBGID, "prepare AUTH");
            await this.requestSSISync();
            await this.createInstance();
            await this.startServices();
            universe.debuglog(DBGID, "prepare AUTH DONE");
        });
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
        this._current = appinstance;
    }

    requestSSISync() {
        return new Promise((resolve, reject) => {
            if (!SSI.is) resolve();
            universe.debuglog(DBGID, "requestSSISync");
            me.addEventListener('synced', resolve, { once: true } );
            me.__requestSync__();
            setTimeout(() => {
                // console.log("Agent: SSI was not synced");
                me.removeEventListener('synced', resolve);
                resolve();
            }, SYNC_WAIT_TIMEOUT);
        });
    }

    async createInstance() {
        if (this._current) return;
        universe.debuglog(DBGID, "createInstance");
        const withUser = await SSI.is;
        // first check if there is a last used, or a 'start with' instance exists
        if (!withUser) {
            // no user for agent instance
            // todo [OPEN]
        } else {
            const id     = await this.id;       // id from the anchor
            const agents = await me.agents;
            if (!agents) throw ErrAgentsForSSInotAvailable(id);
            this._instances = agents;
            // get this agent instance
            let instance    = await agents[id];
            if (!instance) {
                universe.debuglog(DBGID, "createInstance: not availabel");
                // if missing initialize an agent instance
                agents[id] = AgentInstance.for(id);
                await doAsync();
                instance = await agents[id];
                await instance.init();
                universe.debuglog(DBGID, "createInstance: new instance initialized");
            }
            if (instance.constructor !== AgentInstance) {
                universe.debuglog(DBGID, "createInstance: instance is not an AgentInstance");
                debugger;
            }
            this._current    = instance;
            universe.debuglog(DBGID, "createInstance: instance setup");
            const setupspecs = await this.getAgentSetup();
            universe.atDusk(async () => this.shutdownInstance(instance));
            await instance.setup(setupspecs);
            universe.debuglog(DBGID, "createInstance: instance setup DONE");
            return instance;
        }
    }

    async shutdownInstance(instance) {
        await instance.shutdown();
    }

    async getAgentSetup() {
        let   services = {};
        for (const spec of SERVICESPECS) {
            services = { ...services, ...(spec.services ? spec.services : {}) };
        }
        return { services };
/*
        try {
            const specs = {};
            const basedir = universe.env.basedir;
            const files   = getAgentSetupFiles(basedir);
            let   services = {};
            for await (const file of files) {
                const module = await import(file);
                services = { ...services, ...((module.default) ? module.default.services : module.services ? module.services : {}) };
            }
            specs.services = services;
            return specs;
        } catch (e) {
            console.log(e);
        }
*/
    }

}
