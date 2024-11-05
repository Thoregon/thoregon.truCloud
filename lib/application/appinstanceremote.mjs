/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import RemoteHome from "./remotehome.mjs";
import RESTConsumer from "/thoregon.crystalline/lib/consumers/restconsumer.mjs"

const SA    = 'sa';
const NEXUS = 'nexus';

export default class AppInstanceRemote {

    constructor(service, spec) {
        const { appid, id } = spec;
        Object.assign(this, { service, appid, id, spec });
        this.init();
    }

    static withSpec(service, spec) {
        const instance = new this(service, spec);
        return instance;
    }

    init() {
        this.addSAServices();
        this.addNEXUSServices();
        this.addSARESTServices();
        this.addNEXUSRESTServices();
    }

    addSAServices() {
        const servicenames = this.spec.services;
        const services = {};
        servicenames.forEach((service) => {
            const consumer = async () => universe.wsconnector.consumerFor(SA, service);
            services[service] = { consumer };
        })
        this.services = services;
    }

    nexusServiceNames$() {
        const servicenames = new Set(Object.keys(this.services));
        return ['identity', 'portal', 'upayme', 'confirm', 'affiliates', 'aggregation', 'statistics', 'heartbeat'].filter(servicename => !servicenames.has(servicename));
    }

    addNEXUSServices() {
        const servicenames = this.nexusServiceNames$();
        const services = {};
        servicenames.forEach((service) => {
            const consumer = async () => universe.wsconnector.consumerFor(NEXUS, service);
            services[`nexus_${service}`] = { consumer };
        })
        this.services = { ...services, ...this.services };
    }

    addSARESTServices() {
        const servicenames = this.spec.rest;
        const services = {};
        servicenames.forEach((service) => {
            const consumer = async () => RESTConsumer.consumerFor(universe.SA_REST + '/' + (universe.RESTAPI ?? 'restapi'), service);       // universe.path.join(universe.SA_REST, universe.RESTAPI ?? 'restapi')
            services[service] = { consumer };
        })
        this.rest = services;
    }

    addNEXUSRESTServices() {
        // TBD
    }

    get qualifier() {
        return `${this.appid}:${this.id}`;
    }

    restart() {}

    get home() {
        if (this._home) return this._home;
        this._home = RemoteHome.forApp(this.service, this.spec);
        return this._home;
    }

    set home(home) {
        if (home) this._home = home;
    }

    //
    //
    //

    /**
     * create a new entity
     * initial properties can be specified
     * @param {String}  classname  ... full class path
     * @param {Object}  properties
     */
    async create(classname, properties) {
        const service = await universe.RemoteObserver.__getRemoteService__();
        const entity = await service.createEntity(classname, properties);
        return entity;
    }
}