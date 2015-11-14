const {hasOwnProperty, toString} = Object.prototype

function assignSingle(dest, src) {
    const iter = Object(src)
    const keys = Object.keys(iter)
    const len = keys.length
    for (let i = 0; i !== len; i++) {
        const key = keys[i]
        dest[key] = src[key]
    }
}

export function hasOwn(obj, prop) {
    return hasOwnProperty.call(obj, prop)
}

export function forOwn(obj, f) {
    const iter = Object(obj)
    const keys = Object.keys(iter)
    const len = keys.length
    for (let i = 0; i !== len; i++) {
        const key = keys[i]
        if (f(iter[key], key) === false) {
            break
        }
    }
    return obj
}

export function noop() {}

export function identity(x) { return x }

export function isFunction(obj) {
    return typeof obj === "function"
}

export function isObject(obj) {
    return toString.call(obj) === "[object Object]"
}

export function isString(obj) {
    return typeof obj === "string" || obj instanceof String
}

export function assign(dest) {
    for (let i = 1; i < arguments.length; i++) {
        assignSingle(dest, arguments[i])
    }
    return dest
}

export function d(obj, def) {
    return obj != null ? obj : def
}

export function forEach(list, f) {
    for (let i = 0; i < list.length; i++) {
        if (f(list[i], i) === false) {
            break
        }
    }
    return list
}

export function flatPush(dest, entry) {
    if (Array.isArray(entry)) {
        for (let i = 0; i < entry.length; i++) {
            flatPush(dest, entry[i])
        }
    } else {
        dest.push(entry)
    }
}

export function hash() {
    const dest = Object.create(null)
    for (let i = 0; i < arguments.length; i++) {
        assignSingle(dest, arguments[i])
    }
    return dest
}
