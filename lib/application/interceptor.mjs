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

import { ErrInterceptorRetries, ErrMalformedInterceptor } from "../errors.mjs";

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
        return this;
    }


    /*
     * process
     */

    /**
     * check the conditions
     * - if not fulfilled, invoke handler
     * - if fulfilled, resume
     *
     * Aborts when the condition is not fulfilled after 10 tries.
     *
     * @param resume
     */
    async fulfill(resume) {
        if (!this.condition || !this.handler) throw ErrMalformedInterceptor();
        let cnt = 9;
        let storage = {};
        try {
            while (!this.condition(storage) && (cnt--) > 1) {
                await this.handler(storage);
            }
            if (!cnt) storage.error = ErrInterceptorRetries();
        } catch (e) {
            storage.error = e;
        }
        resume(storage);
    }
}
