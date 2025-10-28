/**
 *
 * @module thoregon.truCloud
 * @author: blukassen
 */

export { default as Dorifer } from "./lib/dorifer.mjs";

/*
 * application classes
 */

export { default as ThoregonApplication } from './lib/application/thoregonapplication.mjs';
export { default as AppSegment }          from './lib/application/appsegment.mjs';

/*
 * repository
 */

export { default as ThoregonRepository }  from './lib/repo/thoregonrepository.mjs';


//
// Commons
//

export { isUFD }                          from './lib/commons.mjs';

/*
 * Dorifer is the service supplying the
 * repository for the thoregon system and
 * supporting the thoregon rules
 */
// export default new Dorifer();

// publish annotations
export { Service, AutomationService, Attach, Install, Activate, Deactivate, Uninstall, UseChannels, OnMessage }  from "./lib/service/annotations.mjs"
