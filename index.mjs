/**
 *
 * @module thoregon.truCloud
 * @author: blukassen
 */

import Dorifer from "./lib/dorifer.mjs";

import components       from './@components';
universe.addComponents(components);

/*
 * application classes
 */

export { default as ThoregonApplication } from './lib/application/thoregonapplication.mjs';
export { default as AppSegment }          from './lib/application/appsegment.mjs';

/*
 * Dorifer is the service supplying the
 * repository for the thoregon system and
 * supporting the thoregon rules
 */
export default new Dorifer();
