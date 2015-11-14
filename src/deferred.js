import * as _ from "./util.js"

// Promiz.mithril.js | Zolmeister | MIT
// a modified version of Promiz.js, which does not conform to Promises/A+
// for two reasons:
//
// 1) `then` callbacks are called synchronously (because setTimeout is too
//       slow, and the setImmediate polyfill is too big
// 2) throwing subclasses of Error cause the error to be bubbled up instead
//    of triggering rejection (because the spec does not account for the
//    important use case of default browser error handling, i.e. message w/
//    line number)
const RESOLVING = 1
const REJECTING = 2
const RESOLVED = 3
const REJECTED = 4

function d() {
    const deferred = new Deferred()
    deferred.promise = propify(deferred.promise)
    return deferred
}

export {d as deferred}

function makeProp(store) {
    if ((store != null && _.isObject(store) || _.isFunction(store)) &&
            _.isFunction(store.then)) {
        return propify(store)
    } else {
        return gettersetter(store)
    }
}

export {makeProp as prop}

function gettersetter(store) {
    function prop() {
        if (arguments.length) store = arguments[0]
        return store
    }

    prop.toJSON = function () {
        return store
    }

    return prop
}

function propify(promise, initialValue) {
    const prop = makeProp(initialValue)
    promise.then(prop)

    prop.then = function (resolve, reject) {
        return propify(promise.then(resolve, reject), initialValue)
    }

    prop.catch = prop.then.bind(null, null)

    prop.finally = function (callback) {
        function _callback() {
            return d().resolve(callback()).promise
        }

        return prop.then(
            value => propify(_callback().then(() => value), initialValue),
            reason => propify(_callback().then(() => {
                throw new Error(reason)
            }), initialValue))
    }

    return prop
}

function isNativeError(e) {
    return e instanceof EvalError ||
        e instanceof RangeError ||
        e instanceof ReferenceError ||
        e instanceof SyntaxError ||
        e instanceof TypeError ||
        e instanceof URIError
}

d.onerror = function (e) {
    if (isNativeError(e)) throw e
}

function Deferred(onSuccess, onFailure) {
    const self = this
    let state = 0
    let promiseValue = 0
    const next = []

    self.promise = {}

    self.resolve = function (value) {
        if (!state) {
            promiseValue = value
            state = RESOLVING

            fire()
        }
        return this
    }

    self.reject = function (value) {
        if (!state) {
            promiseValue = value
            state = REJECTING

            fire()
        }
        return this
    }

    self.promise.then = (onSuccess, onFailure) => {
        const deferred = new Deferred(onSuccess, onFailure)
        if (state === RESOLVED) {
            deferred.resolve(promiseValue)
        } else if (state === REJECTED) {
            deferred.reject(promiseValue)
        } else {
            next.push(deferred)
        }
        return deferred.promise
    }

    function finish(type) {
        state = type || REJECTED
        _.forEach(next, deferred => {
            if (state === RESOLVED) {
                deferred.resolve(promiseValue)
            } else {
                deferred.reject(promiseValue)
            }
        })
    }

    function thennable(then, success, fail, notThennable) {
        if (((promiseValue != null && _.isObject(promiseValue)) ||
                _.isFunction(promiseValue)) && _.isFunction(then)) {
            try {
                // count protects against abuse calls from spec checker
                let count = 0
                then.call(promiseValue,
                    value => {
                        if (count++) return
                        promiseValue = value
                        success()
                    },
                    value => {
                        if (count++) return
                        promiseValue = value
                        fail()
                    })
            } catch (e) {
                d.onerror(e)
                promiseValue = e
                fail()
            }
        } else {
            notThennable()
        }
    }

    function fire() {
        // check if it's a thenable
        let then
        try {
            then = promiseValue && promiseValue.then
        } catch (e) {
            d.onerror(e)
            promiseValue = e
            state = REJECTING
            return fire()
        }

        if (state === REJECTING) {
            d.onerror(promiseValue)
        }

        thennable(then,
            () => {
                state = RESOLVING
                fire()
            },
            () => {
                state = REJECTING
                fire()
            },
            () => {
                try {
                    if (state === RESOLVING && _.isFunction(onSuccess)) {
                        promiseValue = onSuccess(promiseValue)
                    } else if (state === REJECTING && _.isFunction(onFailure)) {
                        promiseValue = onFailure(promiseValue)
                        state = RESOLVING
                    }
                } catch (e) {
                    d.onerror(e)
                    promiseValue = e
                    return finish()
                }

                if (promiseValue === self) {
                    promiseValue = TypeError()
                    finish()
                } else {
                    thennable(then, () => {
                        finish(RESOLVED)
                    }, finish, () => {
                        finish(state === RESOLVING && RESOLVED)
                    })
                }
            })
    }
}

export function sync(args) {
    const deferred = d()
    let outstanding = args.length
    const results = new Array(outstanding)
    let method = "resolve"

    function synchronizer(pos, resolved) {
        return function (value) {
            results[pos] = value
            if (!resolved) method = "reject"
            if (--outstanding === 0) {
                deferred.promise(results)
                deferred[method](results)
            }
            return value
        }
    }

    if (args.length > 0) {
        _.forEach(args, (arg, i) => {
            arg.then(synchronizer(i, true), synchronizer(i, false))
        })
    } else {
        deferred.resolve([])
    }

    return deferred.promise
}
