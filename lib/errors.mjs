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
export const ErrAppUnknown              = (msg)             => new EError(`App unknown: ${msg}`,                        "TRUCLOUD:00004");
export const ErrMalformedInterceptor    = ()                => new EError(`Interceptor malformed. Either condition or prerequisite handler missing.`,  "TRUCLOUD:00005");
export const ErrInterceptorRetries      = ()                => new EError(`Interceptor too many retries, aborted`,      "TRUCLOUD:00006");
