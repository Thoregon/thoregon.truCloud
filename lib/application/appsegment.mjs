/**
 * Represents a segment - a part of - an application
 * Used together with widgets
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default (base) => class AppSegment extends (base || Object) {

   /**
    * define the app this segment is based on
    * @param app
    */
   basedOn(app) {
      this._app = app;
   }

   restart() {

   }

}
