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

export default class DeviceAnchor {

    constructor() {
        this._current  = undefined;
        this._instanes = [];
    }

    get current() {
        return this._current;
    }

    set current(device) {
        this._current = device;
    }

    get instances() {
        return this._instanes;
    }

    defaultDeviceName() {
        return thoregon.deviceInfo
        ? thoregon.deviceInfo.name
               : 'unknown device'

        // if (universe.AGENT_NAME) return universe.AGENT_NAME;
        // if (!thoregon.deviceInfo) return;
        // const browser = thoregon.deviceInfo.browser;
        // return  browser.name + ' on ' + browser.os;
    }

    //
    // this API is only available on the current device. therefore it is implemented on the anchor, not on device instance
    //

    get equipment() {
        // a standardized information about the equipment of the device, offers notifications
        // see -> evolux.equipment
        // - standardized device types
        // - standardized UI features, input & output
        // - standardized service features
        return {};
    }

    get performance() {
        // a standardized information for performance measuring, offers notifications
        // see -> evolux.equipment
        return {};
    }

    get network() {
        // a standardized information about the network of the device, offers notifications
        // see -> evolux.equipment
        return {};
    }

    get energy() {
        // a standardized information about the energy state of the device, offers notifications
        // see -> evolux.equipment
        return {};
    }

    get geolocation() {
        // a standardized information about the geolocation of the device, offers notifications
        // see -> evolux.equipment
        return {};
    }

    get system() {
        // a standardized information about the (operating) system of the device, offers notifications
        // see -> evolux.equipment
        return {};
    }
}
