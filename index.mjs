/**
 *
 * @module thoregon.truCloud
 * @author: blukassen
 */

import Dorifer from "./lib/dorifer.mjs";

import components       from './@components';
universe.addComponents(components);

export { default as ThoregonApp }   from './lib/application/thoregonapplication.mjs';

export default new Dorifer();
