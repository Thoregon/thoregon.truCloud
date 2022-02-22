/**
 * Trait (mixin) to implement service meshes
 *
 *  ***** UNUSED *******
 *
 * to specify the mesh in the agent setup use:
 *  peerWith:
 *      name only:      'OtherPeerName'
 *          ... invokes 'peerWith' with { name: 'peername', peer: this } as param on specified peer
 *      collection:      [ 'OtherPeerName1', 'OtherPeerName2', 'OtherPeerName3' ]
 *          ... invokes 'peerWith' with { name: 'peername', peer: this } as param on every specified peers
 *      specification:  {
 *          peers: 'OtherPeerName' || ['OtherPeerName1', 'OtherPeerName2'],
 *          mth: 'methodname'
 *      }
 *          ... invokes 'methodname' with { name: 'peername', peer: this } as param on specified peer(s),
 *
 * todo [OPEN]:
 *  - lifecycle statemachine
 *  - connect events from services to methods of other services (will not need this mixin anymore)
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */


export default (base) => class Service extends (base || Object) {

    constructor(...args) {
        super(...args);
        this.peers = {};        // initialize peers registry for other services in the circle
    }

    //
    // build the mesh
    //

    async peerWith({ peername, peer }) {
        if (!await this.applyPeer(peername, peer)) return;
        this.peers[peername] = peer;
        await peer.peerAccepted?.(this);
    }

    /**
     * invoked on the service peer which uses the specified peer
     * if the peer is accepted, initializations may be done
     * and 'true' should be returned
     * @param peername
     * @param peer
     * @return {Promise<boolean>}   ... true when the peer was accepted and applied
     */
    async applyPeer({ peername, peer }) {
        // override by subclass
        return true;
    }

    /**
     * invoked on the peer which wants to connect
     * tells the other service peer has accepted
     * @param peername
     * @param peer
     * @return {Promise<void>}
     */
    async peerAccepted({ peername, peer }) {
        // implement by subclass
    }

    //
    // lifecyle
    //

    async init(settings) {
        // implement by subclass
    }

    async shut() {
        // implement by subclass
    }

}
