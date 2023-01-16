/**
 * an arbitrary device
 *
 * for each peer a device will be instantiated
 * and is available with: universe.device
 *
 * uses evolux.equipment
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */
import ThoregonEntity from "/thoregon.archetim/lib/thoregonentity.mjs";
import MetaClass      from "/thoregon.archetim/lib/metaclass/metaclass.mjs";

export class DeviceMeta extends MetaClass {

    initiateInstance() {
        this.name = "DeviceInstance";

        this.text("id");
        this.text("name");
        this.object("deviceInfo", Object, { embedded: true });

        this.collection('skils');
    }

}

export default class Device extends ThoregonEntity() {

}

Device.checkIn(import.meta, DeviceMeta);
