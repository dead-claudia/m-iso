import * as _ from "./util.js"

function pushEncodedPair(list, key, value) {
    list.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
}

export function buildQueryString(object, prefix) {
    const duplicates = {}
    const str = []

    _.forOwn(object, (value, prop) => {
        const key = prefix ? `${prefix}[${prop}]` : prop

        if (value === null) {
            str.push(encodeURIComponent(key))
        } else if (_.isObject(value)) {
            str.push(buildQueryString(value, key))
        } else if (Array.isArray(value)) {
            const keys = []
            duplicates[key] = duplicates[key] || {}
            _.forEach(value, item => {
                if (!duplicates[key][item]) {
                    duplicates[key][item] = true
                    pushEncodedPair(keys, key, item)
                }
            })
            str.push(keys.join("&"))
        } else if (value !== undefined) {
            pushEncodedPair(str, key, value)
        }
    })

    return str.join("&")
}

export function parseQueryString(str) {
    if (str === "" || str == null) return {}
    if (str.charAt(0) === "?") str = str.slice(1)

    const pairs = str.split("&")
    const params = {}

    _.forEach(pairs, string => {
        const pair = string.split("=")
        const key = decodeURIComponent(pair[0])
        const value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
        if (params[key] != null) {
            if (!Array.isArray(params[key])) params[key] = [params[key]]
            params[key].push(value)
        } else {
            params[key] = value
        }
    })

    return params
}
