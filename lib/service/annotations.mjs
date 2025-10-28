/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { isNil, isString, isRef, isArray } from "/evolux.util/lib/objutils.mjs";

import { getFunctionParamsAndBody } from "/evolux.util/lib/serialize.mjs";

import Directory                    from "/thoregon.archetim/lib/directory.mjs";
import ChannelController            from "/thoregon.archetim/lib/lightmq/channelcontroller.mjs";

const SERVICE_DEFAULTS = {};

export class Service {

    constructor(target, mthname, meta, params)  {
        Object.assign(this, params);
        this._methods = {};
    }

    //
    // build
    //

    getMethodConfig(name) {
        let mthconfig = this._methods[name];
        if (!mthconfig) mthconfig = this._methods[name] = { name, ...SERVICE_DEFAULTS };
        return mthconfig;
    }

    setMethodConfig(name, config) {
        this._methods[name] = config;
    }


    //
    // process
    //

    hooks() {
        const hooks = {};

        if (this.oninstall)    hooks.oninstall    = async (service, settings)                   => { await service[this.oninstall]?.(settings) }
        if (this.onattach)     hooks.onattach     = async (service, handle, appinstance, home)  => { await service[this.onattach]?.(handle, appinstance, home) }
        if (this.onactivate)   hooks.onactivate   = async (service)                             => { await service[this.onactivate]?.() }
        if (this.ondeactivate) hooks.ondeactivate = async (service)                             => { await service[this.ondeactivate]?.() }
        if (this.onuninstall)  hooks.onuninstall  = async (service)                             => { await service[this.onuninstall]?.() }

        return hooks;
    }

}

export class AutomationService extends Service {

    constructor(target, mthname, meta, params) {
        super(target, mthname, meta, params);
        this.channels = [];
        this.params   = params;
    }

    serve(target, handle, appinstance, home) {
        setTimeout( () => {
            Object.entries(this._methods).forEach(([mthname, handler]) => {
                handler.attachTo(target, handle, appinstance, home, { methodname: mthname, callLimit: this.params?.callLimit, interval: this.params?.interval });
            })
        }, 500);
    }

    addChannels(params) {
        if (!isString(params)) return;
        const channels = params.split(',');
        // console.log("AutomationService addChannels()", channels);
        this.channels = [...this.channels, ...channels];
    }
}

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

class OnMessageHandler {

    constructor({ mthname, channel, event, conditions } = {}) {
        Object.assign(this, { mthname: mthname?.trim(), channel: channel?.trim(), event: event?.trim() });
        this.wrapConditions(conditions);
    }

    wrapConditions(conditions) {
        const conditionfns = [];
        this.conditions = conditionfns;
        if (!isArray(conditions)) return;
        conditions.forEach((condition) => {
            try {
                const { params, body } = getFunctionParamsAndBody(condition);
                if (!params || !body) {
                    console.log("OnMessage: condition is not a valid jd function:", condition);
                    return;
                }
                const conditionfn = new AsyncFunction(`${params.join(', ')}`, `return (${body})`);
                conditionfns.push(conditionfn);
            } catch (e) {
                console.error("OnMessage: can't parse condition", condition, e);
            }
        })
    }

    attachTo(target, handle, appinstance, home, opt) {
        console.log("-- OnMessageHandler attachTo()", this.channel, this.event, this.mthname);
        let fn = target[this.mthname];
        if (!fn) {
            console.log("OnMessage: Method does not exist", this.mthname);
            return;
        }
        const methodname = opt.methodname;
        fn                = fn.bind(target);
        const channelname = this.channel;
        const servicename      = target.constructor.name;
        if (!agent) throw Error("***** NO AGENT :: Cant connect to channel:", channelname, servicename, methodname);
        if (!agent.current) throw Error("***** NO AGENT.CURRENT :: Cant connect to channel:", channelname, servicename, methodname);
        const channel     = agent.current.getChannel(channelname);  // home.channels[this.channel];
        if (!channel) {
            console.log("OnMessage: Channel does not exist", this.channel);
            return;
        }
        (async () => {
            const history          = await agent.current.getHistory(servicename, channelname, methodname);
            const channelController = this.channelController = ChannelController.with(channel, history, async (evt) => {
                if (evt.type !== this.event) return;
                // todo: check all conditions
                for await (const conditionfn of this.conditions) {
                    const res = await conditionfn(evt, handle, appinstance, home);
                    if (!res) return;
                }
                // caution: don't catch exceptions here, this will be handled by the ChannelController!
                await fn(evt);
            }, opt);
            history.channelController = channelController;
        })();
    }

}

class OnErrorHandler {

    constructor({ mthname, channel, event, conditions } = {}) {
        Object.assign(this, { mthname: mthname?.trim(), channel: channel?.trim(), event: event?.trim() });
    }

}

function getService(meta) {
    const clsann   = meta.getClassAnnotations();
    const service = clsann?.Service?.handler ?? clsann?.AutomationService?.handler;
    return service;
}

function getMethodConfig(meta, mthname) {
    const service = getService(meta);
    const mth     = service?.getMethodConfig(mthname);
    return mth;
}

function setMethodConfig(meta, mthname, config) {
    const service = getService(meta);
    const mth     = service?.setMethodConfig(mthname, config);
}

//
//  methods annotations for Service
//

export const Install = (target, mthname, meta, params) => {
    const service = getService(meta);
    service.oninstall = mthname;
};

export const Attach = (target, mthname, meta, params) => {
    const service = getService(meta);
    service.onattach = mthname;
};

export const Activate = (target, mthname, meta, params) => {
    const service = getService(meta);
    service.onactivate = mthname;
};

export const Deactivate = (target, mthname, meta, params) => {
    const service = getService(meta);
    service.ondeactivate = mthname;
};

export const Uninstall = (target, mthname, meta, params) => {
    const service = getService(meta);
    service.onuninstall = mthname;
};

//
// method annotations for AutomatedService
//

export const UseChannels = (target, mthname, meta, params) => {
    const service = getService(meta);
    service.addChannels(params);
};

export const OnMessage = (target, mthname, meta, params) => {
    if (!isString(params)) return;
    const [channel, event, ...conditions] = params.split(',');
    const handler = new OnMessageHandler({ mthname, channel, event, conditions });
    const mth = setMethodConfig(meta, mthname, handler);
};

export const OnError = (target, mthname, meta, params) => {
    if (!isString(params)) return;
    const [channel, event, ...conditions] = params.split(',');
    const handler = new OnErrorHandler({ mthname, channel, event, conditions });
    const mth = setMethodConfig(meta, mthname, handler);
};

//
// now register annotations
//

universe.checkinAnnotation(import.meta, Service);
universe.checkinAnnotation(import.meta, AutomationService);

universe.checkinAnnotation(import.meta, Install);
universe.checkinAnnotation(import.meta, Attach);
universe.checkinAnnotation(import.meta, Activate);
universe.checkinAnnotation(import.meta, Deactivate);
universe.checkinAnnotation(import.meta, Uninstall);

universe.checkinAnnotation(import.meta, UseChannels);
universe.checkinAnnotation(import.meta, OnMessage);
