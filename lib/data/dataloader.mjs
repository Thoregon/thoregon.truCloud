/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { doAsync }  from "/evolux.universe";
import { isObject } from "/evolux.util/lib/objutils.mjs";
import Collection   from "/thoregon.archetim/lib/collection.mjs";

import { $isRef, $deref, $des } from "/evolux.util/lib/datautil.mjs";

export default class DataLoader {

    constructor(props) {
        this.settings = {};
    }

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

    static with({ instance, testdata, autoreload = false } = {}) {
        const loader = new this();
        loader.settings = { instance, testdata, autoreload };
        return loader;
    }

    static withAppId({ instanceid, testdata, autoreload = false } = {}) {
        const loader = new this();
        loader.settings = { instanceid, testdata, autoreload };
        return loader;
    }

    async load() {
        let { instance, instanceid, testdata:locations, autoreload } = this.settings;
        if (!instance && instanceid) instance = await app.getInstance(id);
        if (!instance) {
            console.log("DataLoader", `Appinstance '${id}' not found!`);
            return;
        }

        const data = await this.importData(instance, locations, autoreload);
    }

    async importData(appinstance, locations, autoreload) {
        if (!locations || locations.is_empty) return;
        const refs       = {};
        const resolves   = [];

        //
        const testcol  = me.test;
        testcol.put(universe.random(), { x: universe.random() });
        //


        const start = Date.now();

        const collections = await this.getDataDefintions(locations);

        this.resolveSymbolicReferences(refs, resolves);
        if (autoreload) {
            await this.cleanup(appinstance, collections);
        }
// debugger;
        if (!(await this.isLoaded(appinstance, collections))) {
            console.log(("** DataLoader: Start import **"));
            await this.materialize(appinstance, collections, refs, resolves);
            console.log((`** DataLoader: Import done **: ${Date.now() - start} ms`));
        }


        return { collections, refs };
    }

    async getDataDefintions(locations) {
        const collections = {};
        for await (const location of locations) {
            const part        = (await import(location)).default;
            const { home, $, items } = part;
            collections[home] = { $, items };
        }
        return collections;
    }

    async createItems4collection(collections, home, refs, resolves) {
        const datadef = collections[home];
        const collection         = [];
        const { $, items } = datadef;
        collections[home]        = { $, items: collection };
        for await (const item of items) {
            const entity = await this.resolveItem(item, refs, resolves);
            collection.push(entity);
        }
    }

    async resolveItem(item, refs, resolves) {
        const { $, _, ...properties } = item;       // deconstruct class, symbolic reference and entity properties
        const Cls = await this.getClassFor($);
        const entity = { Cls, _, properties };
        entity.entity = await Cls.create(properties);
        if (_) refs[_] = entity;

        // extract and initiate embedded entities
        for await (const [name, prop] of Object.entries(properties)) {
            if (name.endsWith('#')) {
                // todo [OPEN]: allow composite keys
                // extract key for directory and adjust the property name
                let propname = name.slice(0, -1);
                let key      = properties[name];
                if (key != undefined) entity['#'] = key;
                delete properties[name];
                properties[propname] = key;
            } else if ($isRef(prop)) {
                resolves.push({ name, ref: $deref(prop) });
            } else if (Array.isArray(prop)) {
                // resolve all items in the array
                let subcollection = await entity[name];
                if (!subcollection) {
                    subcollection = await Collection.create();
                    entity[name]  = subcollection;
                    await doAsync();
                }
                for await (const subitem of prop) {
                    if (isObject(subitem) && subitem.$ != undefined) {
                        const subentity = await this.resolveItem(subitem, refs, resolves);
                        if (subentity) {
                            if (subcollection.isKeyed) {
                                const key    = subentity['#'];
                                const sentity = subentity.entity;
                                if (key) {
                                    await subcollection.put(key, sentity);
                                } else {
                                    console.log(">> DataLoader: key missing for entity", subentity);
                                }
                            } else {
                                const sentity = subentity.entity;
                                await subcollection.add(sentity);
                            }
                        }
                    }
                }
            } else if (isObject(prop) && prop.$ != undefined) {
                // resolve the entity in the property
                const subentity = await this.resolveItem(prop, refs, resolves);
                if (subentity) properties[name] = subentity.entity;
            } else {
                properties[name] = $des(properties[name]);
            }
        }

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
        const root = await appinstance.root;
        for await (const name of Object.keys(collections)) {
            delete root[name];
        }
        await doAsync();
    }

    async isLoaded(appinstance, collections) {
        // check if any of the collections is filled
        const root = await appinstance.root;
        for await (const [name, entry] of Object.entries(collections)) {
            let collection = await root.get(name);
            if (collection && !(await collection.is_empty)) return true;
        }
        return false;
    }

    async materialize(appinstance, collections, refs, resolves) {
        const root = await appinstance.root;
        for await (const [name, entry] of Object.entries(collections)) {
            let collection = await root.get(name);
            if (!collection) {
                const { $, keyed = false, items } = entry;
                let CollectionCls = await this.getClassFor($) ?? Collection;
                collection = await CollectionCls.create();
                await root.put(name, collection);
                await doAsync();
            }
            console.log(`-- DataLoader loading: '${name}'`);
            // todo [REFACTOR]: item references must be resolvable!
            await this.createItems4collection(collections, name, refs, resolves);
            const items = collections[name].items;
            if (!collection.isKeyed){
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
