import { Attribute, ThoregonEntity } from "../../../thoregon.archetim/lib/annotation/annotations.mjs";

/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

const SERVICE_DEFAULTS = {};

export default class Service {

    constructor(target, mthname, meta, params)  {
        Object.assign(this, params);
        this._methods = {};
    }

    //
    // build
    //

    getMethodConfig(name) {
        let mthconfig = this._methods[name];
        if (!mthconfig) mthconfig = this._methods[name] = { ...SERVICE_DEFAULTS };
        return mthconfig;
    }


    //
    // process
    //

    hooks() {
        const hooks = {};

        if (this.oninstall)    hooks.oninstall    = async (service, settings)             => { await service[this.oninstall]?.(settings) }
        if (this.onattach)     hooks.onattach     = async (service, handle, appinstance)  => { await service[this.onattach]?.(handle, appinstance) }
        if (this.onactivate)   hooks.onactivate   = async (service)                       => { await service[this.onactivate]?.() }
        if (this.ondeactivate) hooks.ondeactivate = async (service)                       => { await service[this.ondeactivate]?.() }
        if (this.onuninstall)  hooks.onuninstall  = async (service)                       => { await service[this.onuninstall]?.() }

        return hooks;
    }

}


function getService(meta) {
    const clsann   = meta.getClassAnnotations();
    const service = clsann?.Service?.handler;
    return service;
}

function getMethodConfig(meta, mthname) {
    const service = getService(meta);
    const mth     = service?.getMethodConfig(mthname);
    return mth;
}

//
//  methods annotations
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

universe.checkinAnnotation(import.meta, Service);

universe.checkinAnnotation(import.meta, Install);
universe.checkinAnnotation(import.meta, Attach);
universe.checkinAnnotation(import.meta, Activate);
universe.checkinAnnotation(import.meta, Deactivate);
universe.checkinAnnotation(import.meta, Uninstall);
