"use strict"

var _ = require("./util.js")

module.exports.buildQueryString = function buildQueryString(object, prefix) {
    var duplicates = {}
    var str = []
    for (var prop in object) if (_.hasOwn(object, prop)) {
        var value = object[prop]
        var key = prefix ? prefix + "[" + prop + "]" : prop

        if (value === null) {
            str.push(encodeURIComponent(key))
        } else if (_.isObject(value)) {
            str.push(buildQueryString(value, key))
        } else if (Array.isArray(value)) {
            var keys = []
            duplicates[key] = duplicates[key] || {}
            /* eslint-disable no-loop-func  */
            _.forEach(value, function (item) {
                if (!duplicates[key][item]) {
                    duplicates[key][item] = true
                    keys.push(encodeURIComponent(key) + "=" +
                        encodeURIComponent(item))
                }
            })
            /* eslint-enable no-loop-func  */
            str.push(keys.join("&"))
        } else if (value !== undefined) {
            str.push(encodeURIComponent(key) + "=" +
                encodeURIComponent(value))
        }
    }
    return str.join("&")
}

module.exports.parseQueryString = function (str) {
    if (str === "" || str == null) return {}
    if (str.charAt(0) === "?") str = str.slice(1)

    var pairs = str.split("&")
    var params = {}
    _.forEach(pairs, function (string) {
        var pair = string.split("=")
        var key = decodeURIComponent(pair[0])
        var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
        if (params[key] != null) {
            if (!Array.isArray(params[key])) params[key] = [params[key]]
            params[key].push(value)
        } else {
            params[key] = value
        }
    })

    return params
}
