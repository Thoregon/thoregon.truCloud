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

import AccessObserver   from "/evolux.universe/lib/accessobserver.mjs";

import { isFunction, isObject } from "/evolux.util/lib/objutils.mjs";

const delegates = [];

const delegateFor = (obj) => (delegates.find(delegate => delegate.isResponsibleFor(obj)))?.with(obj);

export default class Query {

    constructor(delegate, baseMetaClass) {
        this.delegate      = delegate;
        this.baseMetaClass = baseMetaClass;
        this._retarded       = false;
        this._pendingQ     = [];

        if (delegate) delegate.query     = this;
    }

    static from(collection, baseMetaClass) {
        if (collection instanceof this) return AccessObserver.observe(collection);
        const delegate = delegateFor(collection, this);
        if (!delegate) console.log("Query: unknown collection type, no handler selected");
        const query = new this(delegate, baseMetaClass);
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

    replace(items) {
        return this.delegate.replace(items);
    }

    // get(key) {
    // }

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

    updateSortSequence(column, order) {
        this.delegate.updateSortSequence(column, order);
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

    onSort(fn) {
        this._onSort = fn;
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

    wasSorted() {
        if (this._onSort) this._onSort();
        this.accelerate();
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
        this.window     = {};
        this.listening  = false;
        this.retarded   = true;
        this._filter    = () => true;
    }


    static isResponsibleFor(obj) {
        return !!obj?.$isCollection;
        // return obj instanceof RemoteDirectory || obj instanceof RemoteCollection || obj instanceof Collection || obj instanceof Directory;
    }

    static with(collection, query) {
        const delegate = new this(collection, query);
        return delegate;
    }

    get(key) {
        return this._collection[key];
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

    updateSortSequence(column, order) {debugger;}

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

    prepare() {
        const collection = this.collection;
        const keys = [...collection.$keys];
        for (const key of keys) {
            if (key == undefined) continue;
            // todo [REFACTOR]: don't load item now, restore it when it is requested by the query consumer
            const item = collection[key];
            if (item != undefined && collection.isEnumerable(key) && !isFunction(item)) this.add2win(key, item);
        }
        if (!this.listening) {
            collection.addEventListener('change', (evt) => this.changed(evt));
            this.listening = true;
        }
    }

    changed(evt) {
        if (evt.isSync) return this.applyChanges(evt);

        const { type, obj } = evt;
        const key           = evt.property;
        if (obj && !obj.isEnumerable(key)) return;
        // check in change is a delete
        // todo [REFACTOR]: don't load item now, restore it when it is requested by the query consumer
        const item = obj[key];
        // the event comes after the items was removed from the collection // if (item == undefined) return;  // may be deleted, but does not neet to be handled
        if (type === 'delete') {
            this.removeFromWin(key);
        } else {
            this.add2win(key, item);
        }
        // this.itemAdded(key, item);
    }

    applyChanges(evt) {
        const deletes = evt.changes?.del ?? [];
        const sets    = evt.changes?.set ?? [];

        deletes.forEach((del) => {
            const col = this.collection;
            const key  = del.property;
            if (col.isEnumerable(key)) {
                const item = this.itemFromWindow(key);
                if (item != undefined) this.removeFromWin(key);
            }
        })

        sets.forEach((set) => {
            const col = this.collection;
            const key  = set.property;
            if (col.isEnumerable(key)) {
                const added = col.get(key);
                const item  = this.itemFromWindow(key);
                if (item == undefined) this.add2win(key, added);
            }
        })
    }

    //
    // collection handling
    //

    add2win(key, item) {
        const window = this.window;
        if (!this._filter(item)) return;
        window[key] = item;
        this.itemAdded(key, item);
        // if (this._sort) {
        //     // todo
        //     // this.itemAdded(key, item, beforeKey);
        // } else {
        //     this.itemAdded(key, item);
        // }
    }

    removeFromWin(key) {
        delete this.window[key];
        this.query.itemDropped(key);
    }

    itemAdded(key, item) {
        this.query.itemAdded(key, item);
    }

    itemFromWindow(key) {
        return this.window[key];
    }

}

delegates.push(CollectionQuery);

//
// Remote Collection Query
//


class RemoteCollectionQuery {

    constructor(collection, query) {
        this.collection = collection;
        this.query      = query;
        this.window     = {};
        this.listening  = false;
        this.retarded   = true;
        this._filter    = () => true;
    }


    static isResponsibleFor(obj) {
        return !!obj?.$isRemoteCollection;
        // return obj instanceof RemoteDirectory || obj instanceof RemoteCollection || obj instanceof Collection || obj instanceof Directory;
    }

    static with(collection, query) {
        const delegate = new this(collection, query);
        return delegate;
    }

    async get(key) {
        return this._collection[key];
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

    updateSortSequence(column, order) {debugger;}

    filter(fn) {
        // change filter
    }

    async accelerate() {
        if (!this.listening) await this.prepare();
        this.retarded = false;
    }

    //
    // collection events
    //

    async prepare() {
        if (this.listening) return;
        this.listening = true;
        const collection = this.collection;
        const keys = [...collection.$keys];
        for await (const key of keys) {
            if (key == undefined) continue;
            // todo [REFACTOR]: don't load item now, restore it when it is requested by the query consumer
            const item = await collection[key];
            if (item != undefined && collection.isEnumerable(key) && !isFunction(item)) this.add2win(key, item);
        }
        collection.addEventListener('change', (evt) => this.changed(evt));
    }

    changed(evt) {
        if (evt.isSync) return this.applyChanges(evt);

        const { type, obj } = evt;
        const key           = evt.property;
        if (obj && !obj.isEnumerable(key)) return;
        // check in change is a delete
        // todo [REFACTOR]: don't load item now, restore it when it is requested by the query consumer
        const item = obj[key];
        // the event comes after the items was removed from the collection // if (item == undefined) return;  // may be deleted, but does not neet to be handled
        if (type === 'delete') {
            this.removeFromWin(key);
        } else {
            this.add2win(key, item);
        }
        // this.itemAdded(key, item);
    }

    applyChanges(evt) {
        const deletes = evt.changes?.del ?? [];
        const sets    = evt.changes?.set ?? [];

        deletes.forEach((del) => {
            const col = this.collection;
            const key  = del.property;
            if (col.isEnumerable(key)) {
                const item = this.itemFromWindow(key);
                if (item != undefined) this.removeFromWin(key);
            }
        })

        sets.forEach((set) => {
            const col = this.collection;
            const key  = set.property;
            if (col.isEnumerable(key)) {
                const added = col.get(key);
                const item  = this.itemFromWindow(key);
                if (item == undefined) this.add2win(key, added);
            }
        })
    }

    //
    // collection handling
    //

    add2win(key, item) {
        const window = this.window;
        if (!this._filter(item)) return;
        window[key] = item;
        this.itemAdded(key, item);
        // if (this._sort) {
        //     // todo
        //     // this.itemAdded(key, item, beforeKey);
        // } else {
        //     this.itemAdded(key, item);
        // }
    }

    removeFromWin(key) {
        delete this.window[key];
        this.query.itemDropped(key);
    }

    itemAdded(key, item) {
        this.query.itemAdded(key, item);
    }

    itemFromWindow(key) {
        return this.window[key];
    }

}

delegates.push(RemoteCollectionQuery);

// todo [OPEN]:

class ArrayQuery {

    constructor(array, query) {
        this.array  = this.observeItems(array);
        this.query  = query;
        this.retarded   = true;
        // this.window = {};
    }

    static isResponsibleFor(obj) {
        return Array.isArray(obj);
    }

    static with(array, query) {
        const delegate = new this(array, query);
        return delegate;
    }

    observeItems(items) {
        return items.map(item => this.observed(item));
    }

    get estimatedLength() {
        return this.array?.length ?? 0;
    }

    get(key) {
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

    updateSortSequence(column, order) {

        switch (order) {
            case 'sort-desc':
                this.array.sort((a, b) => {
                    if (typeof a[column] === 'string' && typeof b[column] === 'string') {
                        return b[column].localeCompare(a[column]);
                    } else {
                        return b[column] - a[column];
                    }
                });
                break;
            case 'sort-asc' :
                this.array.sort((a, b) => {
                    if (typeof a[column] === 'string' && typeof b[column] === 'string') {
                        return a[column].localeCompare(b[column]);
                    } else {
                        return a[column] - b[column];
                    }
                });
                break;
            default:
                this.array.sort((a, b) => {
                    if (typeof a[column] === 'string' && typeof b[column] === 'string') {
                        return a[column].localeCompare(b[column]);
                    } else {
                        return a[column] - b[column];
                    }
                });
                break;
        }

        this.retarded = true;
        this.query.wasSorted();

    }

    replace(items) {
        let oldItems = this.array.length;
        this.array = items;
        while (oldItems--) this.query.itemDropped(oldItems);
        this.push();
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

    push() {
        this.retarded = false;
        const array = this.array;
        for (const i in array) {
            const item = array[i];
            const key  = (item['#']) ?? i;
            this.query.itemAdded( key, item );
        }
    }

}

delegates.push(ArrayQuery);

class ObjectQuery extends ArrayQuery {

    static isResponsibleFor(obj) {
        return !super.isResponsibleFor(obj) && isObject(obj);
    }

    observeItems(items) {
        return items; // todo? works so far
        //     return super.observeItems(items ? Object.values(items) : []);
    }

    updateSortSequence(column, order) {debugger;}

    get estimatedLength() {
        return this.array?.length ?? Object.keys(this.array).length ?? 0;
    }

    get asyncIterator() {
        let i = 0;
        let q = this.array;
        let k = Object.keys(q);
        return {
            [Symbol.asyncIterator]() {
                return {
                    next() {
                        if (i < k.length) {
                            return { done: false, value: q[k[i++]] };
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
}

delegates.push(ObjectQuery);

if (globalThis.universe) universe.$Query = Query;
