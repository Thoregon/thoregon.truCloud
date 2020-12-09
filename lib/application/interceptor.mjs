/**
 * an interceptor defines conditions which must be fulfilled
 * to run an app. it also defined how (which component) can be used
 *
 * e.g. an interceptor may specify that a user has to be logged in,
 * if not, offer a login first.
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import { ErrMalformedInterceptor } from "../errors.mjs";

export default class Interceptor {


    /*
     * define interceptor
     */

    withCondition(fn) {
        this.condition = fn;
        return this;
    }

    /**
     *
     * @param handler
     */
    prerequisiteHandler(handler) {
        this.handler = handler;
    }


    /*
     * process
     */

    /**
     * check the conditions
     * - if not fulfilled, invoke handler
     * - if fulfilled, resume
     * @param resume
     */
    async fulfill(resume) {
        if (!this.condition || !this.handler) throw ErrMalformedInterceptor();
        this.resume = resume;
        while (!this.condition()) {
            await this.prerequisiteHandler();
        }
    }
}
