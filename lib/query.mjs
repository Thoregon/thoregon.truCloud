/**
 * a query to handle collections simmilar to a stream interface
 *
 * caution: a stream can not be reused once started. changing the handlers does not start again. always create a new query on the collection
 *
 * todo [OPEN]:
 *  - introduce filters and sorting
 *  -
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import Collection     from "/thoregon.archetim/lib/collection.mjs";
import Directory      from "/thoregon.archetim/lib/directory.mjs";
import AccessObserver from "/evolux.universe/lib/accessobserver.mjs";
import { isFunction } from "/evolux.util/lib/objutils.mjs";

const delegates = [];

const delegateFor = async (obj) => await (delegates.find(delegate => delegate.isResponsibleFor(obj))).with(obj);

export default class Query {

    constructor(delegate, baseMetaClass) {
        this.delegate      = delegate;
        this.baseMetaClass = baseMetaClass;
        this._retarded       = false;
        this._pendingQ     = [];

        if (delegate) delegate.query     = this;
    }

    static async from(collection, baseMetaClass) {
        const query = (collection instanceof this)
                          ? collection
                          : new this(await delegateFor(await collection, this), baseMetaClass);
        const proxy = AccessObserver.observe(query);
        return proxy;
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

    get asyncIterator() {
        return this.delegate.asyncIterator;
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
        this._retarded = true;
    }

    accelerate() {
        this._retarded = false;
        while (this._pendingQ.length > 0 && !this._retarded) {
            const addFn = this._pendingQ.shift();
            addFn();
        }
        if (!this._retarded && this.delegate && this.delegate.retarded) this.delegate.accelerate();
    }

    //
    // Collection handling
    //

    itemAdded(key, item, beforeKey) {
        if (!this._onAdd) return;
        if (this._retarded) {
            this._pendingQ.push(() => this._onAdd(key, item, beforeKey));
        }
        this._onAdd(key, item, beforeKey);
    }

    itemDropped(key) {
        if (!this._onDrop) return;
        if (this._retarded) {
            this._pendingQ.push(() => this._onDrop(key));
        }
        this._onDrop(key);
    }

}

export const EMPTY_QUERY = new Query();

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

    get asyncIterator() {
        return this.collection.asyncIterator;
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
        const keys = [...collection.$keys];
        for await (const key of keys) {
            if (key == undefined) continue;
            // todo [REFACTOR]: don't load item now, restore it when it is requested by the query consumer
            const item = await collection[key];
            if (item != undefined && collection.isEnumerable(key) && !isFunction(item)) this.add2win(key, item);
        }
        if (!this.listening) {
            collection.addEventListener('change', (evt) => this.changed(evt.type, evt.property, evt.obj));
            this.listening = true;
        }
    }

    async changed(type, key, obj) {
        if (obj && !obj.isEnumerable(key)) return;
        // check in change is a delete
        // todo [REFACTOR]: don't load item now, restore it when it is requested by the query consumer
        const item = await obj[key];
        // the event comes after the items was removed from the collection // if (item == undefined) return;  // may be deleted, but does not neet to be handled
        if (type === 'delete') {
            this.removeFromWin(key);
        } else {
            this.add2win(key, item);
        }
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

    removeFromWin(key) {
        this.query.itemDropped(key);
    }

    itemAdded(key, item) {
        this.query.itemAdded(key, item);
    }

}

delegates.push(CollectionQuery);

class ArrayQuery {

    constructor(array, query) {
        this.array  = array.map(item => this.observed(item));
        this.query  = query;
        this.retarded   = true;
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

    get asyncIterator() {
        let i = 0;
        let q = this.array;
        return {
            [Symbol.asyncIterator]() {
                return {
                    next() {
                        if (i < q.length) {
                            return { done: false, value: q[i++] };
                        } else {
                            return { done: true };
                        }
                    },
                    return() {
                        // This will be reached if the consumer called 'break' or 'return' early in the loop.
                        return { done: true };
                    }
                }
            }
        }
    }

    observed(object) {
        return object.__isObserved__ ? object : AccessObserver.observe(object);
    }

    //
    // collection events
    //

    accelerate() {
        if (!this.retarded) return;
        this.push();
    }

    retard() {

    }

    async push() {
        this.retarded = false;
        const array = this.array;
        for (const i in array) {
            const item = await array[i];
            const key  = (await item['#']) ?? i;
            this.query.itemAdded( key, item );
        }
    }

    /*
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
