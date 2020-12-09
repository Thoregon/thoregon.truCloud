/**
 * Handler knowing how to fulfill a prerequisite
 *
 * Subclass for implementations
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

export default class PrerequisiteHandler {

    async fulfill() {
        return true;
    }

}
