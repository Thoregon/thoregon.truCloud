/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { doAsync }        from "/evolux.universe";
import { isObject }       from "/evolux.util/lib/objutils.mjs";
import { $isRef, $deref } from "/evolux.util/lib/testutil.mjs";
import Collection         from "/thoregon.archetim/lib/collection.mjs";

export default class DataLoader {

    constructor(props) {
        this.settings = {};
    }


    static with({ instance, testdata, autoreload = false } = {}) {
        const loader = new this();
        loader.settings = { instance, testdata, autoreload };
        return loader;
    }

    async load() {
        return;
        const { instance:id , testdata:locations, autoreload } = this.settings;
        const appinstance = await app.getInstance(id);
        if (!appinstance) {
            console.log("DataLoader", `Appinstance '${id}' not found!`);
            return;
        }

        const data = await this.importData(appinstance, locations, autoreload);

        // 1) symbol references as keys only, no property as key
        // Key will be defined with '$'
        // test data can only be loaded together due to symbol references between them.
        // if any of the directories exists, no other test data will be imported
        // 'autoreload' must be used to refresh all data

        // 2) object keys in properties
        // define key with $<propertyname>
        // reference with

        // 3) define index on collections with one or more properties
        // reference other objects by <idxname>:<propertycontent>

    }

    async importData(appinstance, locations, autoreload) {
        const collections = {};
        const refs       = {};
        const resolves   = [];

        for await (const location of locations) {
            const part = (await import(location)).default;
            const { home, $, items } = part;
            const collection      = [];
            collections[home]     = { $, items: collection };
            for await (const item of items) {
                const entity = await this.resolveItem(item, refs, resolves);
                collection.push(entity);
            }
        }

        this.resolveSymbolicReferences(refs, resolves);
        if (autoreload) {
            await this.cleanup(appinstance, collections);
        }
        await this.materialize(appinstance, collections);

        return { collections, refs };
    }

    async resolveItem(item, refs, resolves) {
        const { $, _, ...properties } = item;       // deconstruct class, symbolic reference and entity properties
        const Cls = await this.getClassFor($);
        let   key;
        // extract and initiate embedded entities
        for await (const [name, prop] of Object.entries(properties)) {
            if (name.endsWith('#') && key == undefined) {
                // extract key for directory and adjust the property name
                let propname = name.slice(0, -1);
                key          = properties[name];
                delete properties[name];
                properties[propname] = key;
            } else if ($isRef(prop)) {
                resolves.push({ name, ref: $deref(prop) });
            } else if (Array.isArray(prop)) {
                // resolve all items in the array
                const ary = [];
                for await (const subitem of prop) {
                    if (isObject(subitem) && subitem.$ != undefined) {
                        const subentity = await this.resolveItem(subitem, refs, resolves);
                        if (subentity) properties[name] = ary.push(subentity.entity);
                    }
                }
                properties[name] = ary;
            } else if (isObject(prop) && prop.$ != undefined) {
                // resolve the entity in the property
                const subentity = await this.resolveItem(prop, refs, resolves);
                if (subentity) properties[name] = subentity.entity;
            }
        }

        const entity = { Cls, _, properties };
        entity.entity = await Cls.initiate(properties);

        if (key != undefined) entity['#'] = key;
        if (_) refs[_] = entity;

        resolves.forEach((resolve) => resolve.entity = entity.entity );

        return entity;
    }

    async getClassFor($) {
        if (!$) return;
        const parts = $.split(':');
        const moduleName = parts[0];
        const className = (parts.length > 1) ? parts[1] : undefined;
        const module = await import(moduleName);
        let   Cls = (!className)
                    ? module.default
                    : module[className];
        if (!Cls && module.default.name === className) Cls = module.default;
        return Cls;
    }

    resolveSymbolicReferences(refs, resolves) {
        resolves.forEach((resolve) => {
            const { entity, name, ref } = resolve;
            const subentity = refs[ref]?.entity;
            if (subentity) entity[name] = subentity;
        })
    }

    async cleanup(appinstance, collections) {
        for await (const name of Object.keys(collections)) {
            delete appinstance.home[name];
        }
        await doAsync();
    }

    async materialize(appinstance, collections) {
        for await (const [name, entry] of Object.entries(collections)) {
            const { $, items } = entry;
            let home;
            let CollectionCls = await this.getClassFor($) ?? Collection;
            let collection = await CollectionCls.initiate();
            appinstance.home[name] = collection;
            if (CollectionCls === Collection){
                for await (const item of items) {
                    const entity = item.entity;
                    await collection.add(entity);
                }
            } else {
                for await (const item of items) {
                    const key    = item['#'];
                    const entity = item.entity;
                    if (key) {
                        await collection.put(key, entity);
                    } else {
                        console.log(">> DataLoader: key missing for entity", item);
                    }
                }
            }
        }
    }
}
