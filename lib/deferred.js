"use strict"

var _ = require("./util.js")

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
var RESOLVING = 1
var REJECTING = 2
var RESOLVED = 3
var REJECTED = 4

var d = module.exports.deferred = function () {
    var deferred = new Deferred()
    deferred.promise = propify(deferred.promise)
    return deferred
}

var makeProp = module.exports.prop = function (store) {
    if ((store != null && _.isObject(store) || _.isFunction(store)) &&
            _.isFunction(store.then)) {
        return propify(store)
    } else {
        return gettersetter(store)
    }
}

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
    var prop = makeProp(initialValue)
    promise.then(prop)

    prop.then = function (resolve, reject) {
        return propify(promise.then(resolve, reject), initialValue)
    }

    prop.catch = prop.then.bind(null, null)

    prop.finally = function (callback) {
        function _callback() {
            return d().resolve(callback()).promise
        }

        return prop.then(function (value) {
            return propify(_callback().then(function () {
                return value
            }), initialValue)
        }, function (reason) {
            return propify(_callback().then(function () {
                throw new Error(reason)
            }), initialValue)
        })
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
    var self = this
    var state = 0
    var promiseValue = 0
    var next = []

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

    self.promise.then = function (onSuccess, onFailure) {
        var deferred = new Deferred(onSuccess, onFailure)
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
        _.forEach(next, function (deferred) {
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
                var count = 0
                then.call(promiseValue, function (value) {
                    if (count++) return
                    promiseValue = value
                    success()
                }, function (value) {
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
        var then
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

        thennable(then, function () {
            state = RESOLVING
            fire()
        }, function () {
            state = REJECTING
            fire()
        }, function () {
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
                thennable(then, function () {
                    finish(RESOLVED)
                }, finish, function () {
                    finish(state === RESOLVING && RESOLVED)
                })
            }
        })
    }
}

module.exports.sync = function (args) {
    var deferred = d()
    var outstanding = args.length
    var results = new Array(outstanding)
    var method = "resolve"

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
        _.forEach(args, function (arg, i) {
            arg.then(synchronizer(i, true), synchronizer(i, false))
        })
    } else {
        deferred.resolve([])
    }

    return deferred.promise
}
