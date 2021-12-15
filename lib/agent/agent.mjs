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
import { doAsync }                     from "/evolux.universe";



const TAGENT = 'tagent';

export default class Agent {

    constructor() {
        this._current   = undefined;
        this._instances = [];
    }

    static async awake() {
        const agent = new this();
        await agent.establish();
        return agent;
    }

    get id() {
        return this._id;
    }

    async establish() {
        let id = await baseDB.get(TAGENT);
        if (!id) {
            id = universe.random();
            await baseDB.set(TAGENT, id);
        }
        this._id = id;
        universe.agent = this;
        universe.global('agent', this);
        return id;
    }

    /**
     * do not override. prepares instances
     */
    async prepare() {
        universe.Identity.addListener('auth', async (identity) => {
            // get last used instance
            // select agent root for instance
            await this.createInstance();
            await this.startServices();
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

    async createInstance() {
        if (this._current) return;
        const withUser = await me.is;
        // first check if there is a last used, or a 'start with' instance exists
        if (!withUser) {
            // no user for agent instance
            // todo [OPEN]
        } else {
            const ssi    = await me.ssi();
            const id     = await this.id;       // id from the anchor
            const agents = await ssi.agents;
            if (!agents) throw ErrAgentsForSSInotAvailable(id);
            this._instances = agents;
            // get this agent instance
            let instance    = await agents[id];
            if (!instance) {
                // if missing initialize an agent instance
                agents[id] = AgentInstance.for(id);
                await doAsync();
                instance = await agents[id];
                await instance.init();
            }
            this._current = instance;
            return instance;
        }
    }

}
