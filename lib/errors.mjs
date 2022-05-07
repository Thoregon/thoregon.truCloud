/**
 * defines all errors used in pubsub
 *
 * @author: blukassen
 */
import { EError }       from '/evolux.supervise';
import { className }    from "/evolux.util";

export const ErrNotImplemented            = (msg)             => new EError(`Not implemented: ${msg}`,                        "TRUCLOUD:00001");
export const ErrNoAppElement              = ()                => new EError('No <thoregon-app> element found',                "TRUCLOUD:00002");
export const ErrNoUI                      = ()                => new EError('Peer has no UI',                                 "TRUCLOUD:00003");
export const ErrAppUnknown                = (msg)             => new EError(`App unknown: ${msg}`,                            "TRUCLOUD:00004");
export const ErrMalformedInterceptor      = ()                => new EError(`Interceptor malformed. Either condition or prerequisite handler missing.`,  "TRUCLOUD:00005");
export const ErrInterceptorRetries        = ()                => new EError(`Interceptor too many retries, aborted`,          "TRUCLOUD:00006");
export const ErrNotAvailable              = (msg)             => new EError(`Component not available: ${msg}`,                "TRUCLOUD:00007");
export const ErrIllegalArgument           = (msg)             => new EError(`Illegal arbument: ${msg}`,                       "TRUCLOUD:00008");

export const ErrDirectoryFactoryNotFound  = (msg)             => new EError(`Directory Factory not found: ${msg}`,            "TRUCLOUD:00101");
export const ErrDirectoryProviderNotFound = (msg)             => new EError(`Directory Provider not found: ${msg}`,           "TRUCLOUD:00102");

export const ErrAppsForSSInotAvailable    = (msg)             => new EError(`Apps directory for SSI not available: ${msg}`,   "TRUCLOUD:00201");
export const ErrAgentsForSSInotAvailable  = (msg)             => new EError(`Agents directory for SSI not available: ${msg}`, "TRUCLOUD:00201");

export const ErrFileStorageAdapterExists  = (msg)             => new EError(`Storage Adapter already exists: ${msg}`,         "TRUCLOUD:00301");
export const ErrFileUIAdapterExists       = (msg)             => new EError(`UI Adapter already exists: ${msg}`,              "TRUCLOUD:00302");
export const ErrNoFileStorageAdapter      = ()                => new EError(`No Storage Adapter available`,                   "TRUCLOUD:00303");
export const ErrNoUIAdapter               = ()                => new EError(`No UI Adapter available`,                        "TRUCLOUD:00304");
export const ErrURIMissing                = ()                => new EError(`URI missing`,                                    "TRUCLOUD:00305");
export const ErrMalformedURI              = (msg)             => new EError(`Malformed URI: ${msg}`,                          "TRUCLOUD:00306");
export const ErrUnsupportedURIProtocol    = (msg)             => new EError(`Unsupported URI Protocol: ${msg}`,               "TRUCLOUD:00307");
export const ErrCIDMissing                = (msg)                => new EError(`DCI missing, File not persistent: ${msg}`,    "TRUCLOUD:00308");
