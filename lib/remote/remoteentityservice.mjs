/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { Service, Attach }                    from "/thoregon.truCloud";
import ThoregonDecorator                      from "/thoregon.archetim/lib/thoregondecorator.mjs";

let EntityDecorator = ThoregonDecorator;

function getEntity(soul) {
    return universe.neuland.has(soul) || ThoregonDecorator.isKnownEntity(soul) ? ThoregonDecorator.from(soul) : undefined;    /*ThoregonDecorator.isKnownEntity(soul)*/
}

const CLASS_URI_MAPPING = {
    'UnifiedFileDescriptor': { path: '/thoregon.truCloud/lib/unifiedfile/unifiedfiledescriptor.mjs' },
}

"@Service"
export default class RemoteEntityService {

    "@Attach"
    async attach(handle, appinstance, home) {
        this.handle   = handle;
        this.instance = appinstance;
        this.home     = home;

        this.clients = [];
        console.log(">> RemoteEntityService", appinstance.qualifier);
    }

    getEntity(soul) {
        const entity = getEntity(soul);
        if (!entity) return;

        // console.log(".. RemoteEntityService::getEntity", soul);
        return entity;
    }

    async createEntity(classpath, properties) {
        // create thoregon entity
        const { path, name } = this.getImportPath(classpath);
        const module = await import(path);
        const Cls = name ? module[name] : module.default;
        const entity = Cls.create(properties);
        console.log("-- RemoteEntityService::createEntity", entity.soul, classpath);
        return entity;
    }

    getEntityProperty(soul, property) {
        const entity = getEntity(soul);
        if (!entity) return;
        const value = entity[property];
        return value;
    }

    setEntityProperty(soul, property, value) {
        const entity = getEntity(soul);
        if (!entity) return;
        // const value = remotedeserialize(servalue);
        entity[property] = value;
    }

    deleteEntityProperty(soul, property) {
        const entity = getEntity(soul);
        if (!entity) return;
        const value = entity[property];
        delete entity[property];
    }

    invokeOnEntity(soul, method, params) {
        const entity = getEntity(soul);
        if (!entity) return;
        console.log("-- RemoteEntityService::invokeOnEntity", soul, method, params);

        return params
               ? entity[method](...params)
               : entity[method]();
    }

    //
    // Events
    //

    subscribe$(name, handler, req, origin) {
        console.log("-- RemoteEntityService::subscribe", name);
        if (name === 'deep-change') {
            EntityDecorator.addDeepListener('change', (...args) => {
                handler(...args);
            });
        } else {
            // const soul   = req.args.soul;
            // const entity = getEntity(soul);
            // entity.addEventListener(name, handler);
        }
    }

    //
    // helpers
    //

    getImportPath(classpath) {
        // todo [OPEN]: introduce a Class - Path mapping to entity classes for convenience
        if (CLASS_URI_MAPPING[classpath]) return CLASS_URI_MAPPING[classpath];
        let name;
        const parts = classpath.split(':');
        if (parts.length > 1) name = parts[1];
        let path = parts[0].replace(/\./g, "/");
        if (!path.startsWith("/")) path = `/${path}`;
        if (!path.endsWith(".mjs")) path = `${path}.mjs`;
        return { path, name };
    }

    //
    // events
    //

    addEventLisener(soul, event) {

    }

    //
    // deep listener
    //

    addDeepChangeListener() {

    }
}