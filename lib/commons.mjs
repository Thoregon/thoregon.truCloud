/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

import UnifiedFileDescriptor from "./unifiedfile/unifiedfiledescriptor.mjs";

//
// Thoregon types
//

export const isUFD       = (obj) => obj?.constructor.ufd ?? false;   // obj instanceof UnifiedFileDescriptor;
