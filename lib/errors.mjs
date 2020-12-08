/**
 * defines all errors used in pubsub
 *
 * @author: blukassen
 */
import { EError }       from '/evolux.supervise';
import { className }    from "/evolux.util";

export const ErrNotImplemented          = (msg)             => new EError(`Not implemented: ${msg}`,                    "TRUCLOUD:00001");
export const ErrNoAppElement            = ()                => new EError('No <thoregon-app> element found',            "TRUCLOUD:00002");
export const ErrNoUI                    = ()                => new EError('Peer has no UI',                             "TRUCLOUD:00003");
