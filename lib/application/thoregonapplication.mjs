/*
 * This is the base class for all applications within the thoregon ecosystem
 * defines entrypoints to start/restart the application
 * handling of attests
 *
 * @author: Martin Neitz, Bernhard Lukassen
 *
 */

export default class ThoregonApplication {
    //--- APP ID  123
    //--- Version
    //--- restart   -> application router call....
    //--- get description
    //--- get Image / Icons
    //--- view/change attest

    restart(state) {

    }

    /*
     * implement by subclasses
     */
    onRegister() {

    }

    onUnregister() {

    }
}
