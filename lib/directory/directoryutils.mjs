/**
 *
 *
 * @author: Bernhard Lukassen
 * @licence: MIT
 * @see: {@link https://github.com/Thoregon}
 */

// todo: use regexp which allows ',' and '=' as param content
export const parseSearchParams = (searchparams) => {
    let params = {};
    let p1 = searchparams.split(',');
    p1.forEach(param => {
        let p2 = param.split('=');
        if (p2.length === 2) {
            params[p2[0]] = p2[1];
        }
    });
    return params;
}
