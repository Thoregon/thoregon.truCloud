/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

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

    static with({ instance, testdata, autoreload = false, loadTestData } = {}) {
        const loader = new this();
        loader.settings = { instance, testdata, autoreload, loadTestData };
        return loader;
    }

    static withAppId({ instanceid, testdata, autoreload = false } = {}) {
        const loader = new this();
        loader.settings = { instanceid, testdata, autoreload, loadTestData };
        return loader;
    }

    load() {
        let { instance, instanceid, testdata:locations, autoreload, loadTestData } = this.settings;
        if (!loadTestData) return;

        if (!instance && instanceid) instance = app.getInstance(id);
        if (!instance) {
            console.log("DataLoader", `Appinstance '${id}' not found!`);
            return;
        }

        const data = this.importData(instance, locations, autoreload);
    }

    importData(appinstance, locations, autoreload) {
        if (!locations || locations.is_empty) return;
        const refs       = {};
        const resolves   = [];

        //
        const testcol  = me.test;
        testcol.put(universe.random(), { x: universe.random() });
        //


        const start = Date.now();

        const collections = this.getDataDefintions(locations);

        this.resolveSymbolicReferences(refs, resolves);
        if (autoreload) {
            this.cleanup(appinstance, collections);
        }
// debugger;
        if (!(this.isLoaded(appinstance, collections))) {
            console.log(("** DataLoader: Start import **"));
            debugger;
            this.materialize(appinstance, collections, refs, resolves);
            console.log((`** DataLoader: Import done **: ${Date.now() - start} ms`));
        }


        return { collections, refs };
    }

    getDataDefintions(locations) {
        const collections = {};
        for (const location of locations) {
            const part        = (import(location)).default;
            const { home, $, items } = part;
            collections[home] = { $, items };
        }
        return collections;
    }

    createItems4collection(collections, home, refs, resolves) {
        const datadef = collections[home];
        const collection         = [];
        const { $, items } = datadef;
        collections[home]        = { $, items: collection };
        for (const item of items) {
            const entity = this.resolveItem(item, refs, resolves);
            collection.push(entity);
        }
    }

    resolveItem(item, refs, resolves) {
        const { $, _, ...properties } = item;       // deconstruct class, symbolic reference and entity properties
        const Cls = this.getClassFor($);
        const entity = { Cls, _, properties };
        entity.entity = Cls.create(properties);
        if (_) refs[_] = entity;

        // extract and initiate embedded entities
        for (const [name, prop] of Object.entries(properties)) {
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
                let subcollection = entity[name];
                if (!subcollection) {
                    subcollection = Collection.create();
                    entity[name]  = subcollection;
                }
                for (const subitem of prop) {
                    if (isObject(subitem) && subitem.$ != undefined) {
                        const subentity = this.resolveItem(subitem, refs, resolves);
                        if (subentity) {
                            if (subcollection.isKeyed) {
                                const key    = subentity['#'];
                                const sentity = subentity.entity;
                                if (key) {
                                    subcollection.put(key, sentity);
                                } else {
                                    console.log(">> DataLoader: key missing for entity", subentity);
                                }
                            } else {
                                const sentity = subentity.entity;
                                subcollection.add(sentity);
                            }
                        }
                    }
                }
            } else if (isObject(prop) && prop.$ != undefined) {
                // resolve the entity in the property
                const subentity = this.resolveItem(prop, refs, resolves);
                if (subentity) properties[name] = subentity.entity;
            } else {
                properties[name] = $des(properties[name]);
            }
        }

        resolves.forEach((resolve) => resolve.entity = entity.entity );

        return entity;
    }

    getClassFor($) {
        if (!$) return;
        const parts = $.split(':');
        const moduleName = parts[0];
        const className = (parts.length > 1) ? parts[1] : undefined;
        const module = import(moduleName);
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

    cleanup(appinstance, collections) {
        const root = appinstance.root;
        for (const name of Reflect.ownKeys(collections)) {
            delete root[name];
        }
    }

    isLoaded(appinstance, collections) {
        // check if any of the collections is filled
        const root = appinstance.root;
        for (const name of Reflect.ownKeys(collections)) {
            const entry = Reflect.get(collections, name);
            let collection = root.get(name);
            if (collection && !(collection.is_empty)) return true;
        }
        return false;
    }

    materialize(appinstance, collections, refs, resolves) {
        const root = appinstance.root;
        for (const [name, entry] of Object.entries(collections)) {
            let collection = root.get(name);
            if (!collection) {
                const { $, keyed = false, items } = entry;
                let CollectionCls = this.getClassFor($) ?? Collection;
                collection = CollectionCls.create();
                root.put(name, collection);
            }
            console.log(`-- DataLoader loading: '${name}'`);
            // todo [REFACTOR]: item references must be resolvable!
            this.createItems4collection(collections, name, refs, resolves);
            const items = collections[name].items;
            if (!collection.isKeyed){
                for (const item of items) {
                    const entity = item.entity;
                    collection.add(entity);
                }
            } else {
                for  (const item of items) {
                    const key    = item['#'];
                    const entity = item.entity;
                    if (key) {
                        collection.put(key, entity);
                    } else {
                        console.log(">> DataLoader: key missing for entity", item);
                    }
                }
            }
        }
    }
}
