"use strict"

var hasOwn = Object.prototype.hasOwnProperty
var toString = Object.prototype.toString

module.exports = {
    hasOwn: function (obj, prop) {
        return hasOwn.call(obj, prop)
    },

    noop: function () {},

    identity: function (x) { return x },

    isFunction: function (obj) {
        return typeof obj === "function"
    },

    isObject: function (obj) {
        return toString.call(obj) === "[object Object]"
    },

    isString: function (obj) {
        return typeof obj === "string" || obj instanceof String
    },

    assign: function (dest) {
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i]
            for (var prop in src) if (hasOwn.call(src, prop)) {
                dest[prop] = src[prop]
            }
        }
        return dest
    },

    d: function (obj, def) {
        return obj != null ? obj : def
    },

    forEach: function (list, f) {
        for (var i = 0; i < list.length; i++) {
            if (f(list[i], i)) break
        }
    }
}
