/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import Collection         from "/thoregon.archetim/lib/collection.mjs";
import Directory          from "/thoregon.archetim/lib/directory.mjs";
import { ThoregonObject } from "../../thoregon.archetim/lib/thoregonentity.mjs";

const delegates = [];

const delegateFor = async (obj) => await (delegates.find(delegate => delegate.isResponsibleFor(obj))).with(obj);

export default class Query {

    constructor(delegate, baseMetaClass) {
        this.delegate      = delegate;
        this.baseMetaClass = baseMetaClass;
        this._retard       = false;
        delegate.query     = this;
    }

    static async from(collection, baseMetaClass) {
        const query         = new this(await delegateFor(collection, this), baseMetaClass);
        return query;
    }

    set baseMetaClass( baseMetaClass ) { this._baseMetaClass = baseMetaClass; }
    get baseMetaClass() { return this._baseMetaClass; }

    //
    // basic collection methods
    //

    get estimatedLength() {

    }
    async get(key) {
    }

    //
    // order and selection
    //

    reverse() {

    }

    order(fn) {
        // todo
    }

    select(fn) {
        // todo
    }

    //
    // collection events
    //

    onAdd(fn) {
        this._onAdd = fn;
        this.accelerate();
        return this;
    }

    onMove(fn) {
        this._onMove = fn;
        this.accelerate();
        return this;
    }

    onDrop(fn) {
        this._onDrop = fn;
        this.accelerate();
        return this;
    }

    onFlush(fn) {
        this._onFlush = fn;
        this.accelerate();
        return this;
    }

    retard() {
        this._retard = true;
    }

    accelerate() {
        this._retard = false;
        if (this.delegate.retarded) this.delegate.accelerate();
    }

    //
    // Collection handling
    //

    itemAdded(key, item, beforeKey) {
        if (this._retard) {
            this._pendingQ.push(() => this.itemAdded(key, item, beforeKey));
        }
        this._onAdd?.(key, item, beforeKey);
    }

}

class CollectionQuery {

    constructor(collection, query) {
        this.collection = collection;
        this.query      = query;
        this.window     = [];
        this.listening  = false;
        this.retarded   = true;
        this._filter    = () => true;
    }


    static isResponsibleFor(obj) {
        return obj instanceof Collection || obj instanceof Directory;
    }

    static async with(collection, query) {
        const delegate = new this(collection, query);
        return delegate;
    }

    async get(key) {
        return await this._collection[key];
    }

    //
    // collection control
    //

    sort(fn) {
        // change sort
    }

    filter(fn) {
        // change filter
    }

    accelerate() {
        if (!this.listening) this.prepare();
        this.retarded = false;
    }

    //
    // collection events
    //

    async prepare() {
        const collection = this.collection;
        const keys = [...collection.propertyNames];
        for await (const key of keys) {
            this.add2win(await collection[key]);
            // this.query.itemAdded(key, item);
        }
        collection.addEventListener('change', (evt) => this.changed(evt.property, evt.obj));
        this.listening = true;
    }

    async changed(key, obj) {
        const item = await obj[key];
        this.add2win(key, item);
        // this.itemAdded(key, item);
    }

    //
    // collection handling
    //

    add2win(key, item) {
        const window = this.window;
        if (!this._filter(item)) return;
        if (this._sort) {
            // todo
            // this.itemAdded(key, item, beforeKey);
        } else {
            window.push({ key, item });
            this.itemAdded(key, item);
        }
    }

    itemAdded(key, item) {
        this.query.itemAdded(key, item);
    }

}

delegates.push(CollectionQuery);

class ArrayQuery {

    constructor(array, query) {
        this.array  = array;
        this.query  = query;
        // this.window = {};
    }

    static isResponsibleFor(obj) {
        return obj instanceof Array;
    }

    static async with(array, query) {
        const delegate = new this(array, query);
        return delegate;
    }

    get estimatedLength() {
        return this.array?.length ?? 0;
    }

    async get(key) {
        return this.array[key];
    }

    get itemKeys() {
        return {
            [Symbol.asyncIterator]: () => {
                let i = 0;
                let q = this;
                return {
                    async next() { // (2)
                        if (i < q.length) {
                            return {done: false, value: i++};
                        } else {
                            return {done: true};
                        }
                    }
                };
            }
        }
    }

    //
    // collection events
    //

    accelerate() {

    }

    retard() {

    }

    /*
        [Symbol.asyncIterator]() {
            let i = 0;
            let q = this;
            return {
                async next() { // (2)
                    if (i < q.length) {
                        return { done: false, value: q._from[i++] };
                    } else {
                        return { done: true };
                    }
                }
            };
        }
    */

}

delegates.push(ArrayQuery);

if (globalThis.universe) universe.$Query = Query;
