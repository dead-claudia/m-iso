import * as m from "../src/deferred.js"

import * as sinon from "sinon"
import chai, {expect} from "chai"
import sinonChai from "sinon-chai"
chai.use(sinonChai)

describe("deferred", () => {
    describe("deferred()", () => { // eslint-disable-line max-statements
        // Let unchecked exceptions bubble up in order to allow meaningful error
        // messages in common cases like null reference exceptions due to typos.
        // An unchecked exception is defined as an object that is a subclass of
        // Error (but not a direct instance of Error itself) - basically
        // anything that can be thrown without an explicit `throw` keyword and
        // that we'd never want to programmatically manipulate. In other words,
        // an unchecked error is one where we only care about its line number
        // and where the only reasonable way to deal with it is to change the
        // buggy source code that caused the error to be thrown in the first
        // place.
        //
        // By contrast, a checked exception is defined as anything that is
        // explicitly thrown via the `throw` keyword and that can be
        // programmatically handled, for example to display a validation error
        // message on the UI. If an exception is a subclass of Error for
        // whatever reason, but it is meant to be handled as a checked exception
        // (i.e. follow the rejection rules for A+), it can be rethrown as an
        // instance of Error.
        //
        // This implementation deviates from the Promises/A+ spec in two ways:
        //
        // 1) A+ requires the `then` callback to be called asynchronously (this
        //    requires a setImmediate polyfill, which cannot be implemented in a
        //    reasonable way for Mithril's purpose - the possible polyfills are
        //    either too big or too slow). This implementation calls the `then`
        //    callback synchronously.
        // 2) A+ swallows exceptions in a unrethrowable way, i.e. it's not
        //    possible to see default error messages on the console for runtime
        //    errors thrown from within a promise chain. This throws such
        //    checked exceptions.

        it("exists", () => {
            expect(m.deferred).to.be.a("function")
        })

        it("resolves values", () => {
            const spy = sinon.spy()
            const deferred = m.deferred()

            deferred.promise.then(spy)
            deferred.resolve("test")

            expect(spy).to.be.calledWithExactly("test")
        })

        it("resolves values returned in `then` method", () => {
            const spy = sinon.spy()
            const deferred = m.deferred()

            deferred.promise
            .then(() => "foo")
            .then(spy)
            deferred.resolve("test")

            expect(spy).to.be.calledWithExactly("foo")
        })

        it("passes rejections through second `then` handler", () => {
            const fufill = sinon.spy()
            const reject = sinon.spy()
            const deferred = m.deferred()

            deferred.promise.then(fufill, reject)
            deferred.reject("test")

            expect(fufill).to.not.have.been.called
            expect(reject).to.be.calledWithExactly("test")
        })

        it("passes rejections through `catch`", () => {
            const spy = sinon.spy()
            const deferred = m.deferred()

            deferred.promise.catch(spy)
            deferred.reject("test")

            expect(spy).to.be.calledWithExactly("test")
        })

        it("can resolve from a `then` rejection handler", () => {
            const spy = sinon.spy()
            const deferred = m.deferred()

            deferred.promise
            .then(null, () => "foo")
            .then(spy)
            deferred.reject("test")

            expect(spy).to.be.calledWithExactly("foo")
        })

        it("can resolve from a `catch`", () => {
            const value = m.prop()
            const deferred = m.deferred()

            deferred.promise
            .catch(() => "foo")
            .then(value)
            deferred.reject("test")

            expect(value()).to.equal("foo")
        })

        it("can reject by throwing an `Error`", () => {
            const value1 = m.prop()
            const value2 = m.prop()
            const deferred = m.deferred()

            deferred.promise
            .then(() => { throw new Error() })
            .then(value1, value2)
            deferred.resolve("test")

            expect(value1()).to.not.exist
            expect(value2()).to.be.an("error")
        })

        it("synchronously throws subclasses of Errors on creation", () => {
            const deferred = m.deferred()
            expect(() => deferred.reject(new TypeError())).to.throw()
        })

        // This cannot be stubbed with Sinon. See
        // https://github.com/sinonjs/sinon/issues/922
        function throwTypeError() {
            throw new TypeError()
        }

        it("synchronously throws subclasses of Errors thrown from its `then` fufill handler", () => { // eslint-disable-line
            const deferred = m.deferred()
            deferred.promise.then(throwTypeError)
            expect(() => deferred.resolve()).to.throw()
        })

        it("synchronously throws subclasses of Errors thrown from its `then` rejection handler", () => { // eslint-disable-line
            const deferred = m.deferred()
            deferred.promise.then(null, throwTypeError)
            expect(() => deferred.reject("test")).to.throw()
        })

        it("synchronously throws subclasses of Errors thrown from its `catch` method", () => { // eslint-disable-line
            const deferred = m.deferred()
            deferred.promise.catch(throwTypeError)
            expect(() => deferred.reject("test")).to.throw()
        })

        it("unwraps other thenables, and returns the correct values in the chain", () => { // eslint-disable-line
            const deferred1 = m.deferred()
            const deferred2 = m.deferred()

            const spy1 = sinon.spy(() => deferred2.promise)
            const spy2 = sinon.spy()

            deferred1.promise.then(spy1).then(spy2)

            deferred1.resolve(1)
            deferred2.resolve(2)

            expect(spy1).to.have.been.calledWithExactly(1)
            expect(spy2).to.have.been.calledWithExactly(2)
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("propogates returns with `then` after being resolved", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()

            deferred.resolve(1)
            deferred.promise.then(spy)

            expect(spy).to.be.calledWithExactly(1)
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("propogates errors with `then` after being rejected", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()

            deferred.reject(1)
            deferred.promise.then(null, spy)

            expect(spy).to.be.calledWithExactly(1)
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("can only be resolved once before being chained", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()
            deferred.resolve(1)
            deferred.resolve(2)
            deferred.promise.then(spy)
            expect(spy).to.be.calledOnce.and.calledWithExactly(1)
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("can only be resolved once after being chained", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()
            deferred.promise.then(spy)
            deferred.resolve(1)
            deferred.resolve(2)
            expect(spy).to.be.calledOnce.and.calledWithExactly(1)
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("can't be rejected after being resolved", () => {
            const deferred = m.deferred()
            const spy1 = sinon.spy()
            const spy2 = sinon.spy()
            deferred.promise.then(spy1, spy2)
            deferred.resolve(1)
            deferred.reject(2)
            expect(spy1).to.be.calledOnce.and.calledWithExactly(1)
            expect(spy2).to.not.have.been.called
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("can't be resolved after being rejected", () => {
            const deferred = m.deferred()
            const spy1 = sinon.spy()
            const spy2 = sinon.spy()
            deferred.promise.then(spy1, spy2)
            deferred.reject(1)
            deferred.resolve(2)
            expect(spy1).to.not.have.been.called
            expect(spy2).to.be.calledOnce.and.calledWithExactly(1)
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("can only be rejected once before being chained", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()
            deferred.reject(1)
            deferred.reject(2)
            deferred.promise.then(null, spy)
            expect(spy).to.be.calledOnce.and.calledWithExactly(1)
        })

        // https://github.com/lhorie/mithril.js/issues/80
        it("can only be rejected once after being chained", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()
            deferred.promise.then(null, spy)
            deferred.reject(1)
            deferred.reject(2)
            expect(spy).to.be.calledOnce.and.calledWithExactly(1)
        })

        // https://github.com/lhorie/mithril.js/issues/85
        it("calls resolution handler when resolved with `undefined`", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()
            deferred.resolve()
            deferred.promise.then(spy)
            expect(spy).to.be.calledOnce.and.calledWithExactly(undefined)
        })

        // https://github.com/lhorie/mithril.js/issues/85
        it("calls rejection handler when rejected with `undefined`", () => {
            const deferred = m.deferred()
            const spy = sinon.spy()
            deferred.reject()
            deferred.promise.then(null, spy)
            expect(spy).to.be.calledOnce.and.calledWithExactly(undefined)
        })

        it("immediately resolves promise with `resolve` method", () => {
            const deferred = m.deferred()
            deferred.resolve(1)
            expect(deferred.promise()).to.equal(1)
        })

        it("gets chained promise value when called", () => {
            const deferred = m.deferred()
            const promise = deferred.promise.then(data => data + 1)
            deferred.resolve(1)
            expect(promise()).to.equal(2)
        })

        it("returns `undefined` from call if it's rejected", () => {
            const deferred = m.deferred()
            deferred.reject(1)
            expect(deferred.promise()).to.be.undefined
        })
    })

    describe("sync()", () => {
        it("exists", () => {
            expect(m.sync).to.be.a("function")
        })

        it("joins multiple promises in order to an array", () => {
            const spy = sinon.spy()
            const deferred1 = m.deferred()
            const deferred2 = m.deferred()

            m.sync([deferred1.promise, deferred2.promise]).then(spy)

            deferred1.resolve("test")
            deferred2.resolve("foo")

            expect(spy).to.be.calledWithMatch(["test", "foo"])
        })

        it("joins multiple promises out of order to an array", () => {
            const spy = sinon.spy()
            const deferred1 = m.deferred()
            const deferred2 = m.deferred()

            m.sync([deferred1.promise, deferred2.promise]).then(spy)

            deferred2.resolve("foo")
            deferred1.resolve("test")

            expect(spy).to.be.calledWithMatch(["test", "foo"])
        })

        it("rejects to an array if one promise rejects", () => {
            const spy = sinon.spy()
            const deferred = m.deferred()
            m.sync([deferred.promise]).catch(spy)
            deferred.reject("fail")
            expect(spy).to.be.calledWithMatch(["fail"])
        })

        it("resolves immediately if given an empty array", () => {
            const spy = sinon.spy()
            m.sync([]).then(spy)
            expect(spy).to.have.been.calledOnce
        })

        it("resolves to an empty array if given an empty array", () => {
            const spy = sinon.spy()
            m.sync([]).then(spy)
            expect(spy).to.have.been.calledWithMatch([])
        })
    })

    describe("prop()", () => {
        it("reads correct value", () => {
            const prop = m.prop("test")
            expect(prop()).to.equal("test")
        })

        it("defaults to `undefined`", () => {
            const prop = m.prop()
            expect(prop()).to.be.undefined
        })

        it("sets the correct value", () => {
            const prop = m.prop("test")
            prop("foo")
            expect(prop()).to.equal("foo")
        })

        it("sets `null`", () => {
            const prop = m.prop(null)
            expect(prop()).to.be.null
        })

        it("sets `undefined`", () => {
            const prop = m.prop(undefined)
            expect(prop()).to.be.undefined
        })

        it("returns the new value when set", () => {
            const prop = m.prop()
            expect(prop("foo")).to.equal("foo")
        })

        it("correctly stringifies to the correct value", () => {
            const prop = m.prop("test")
            expect(JSON.stringify(prop)).to.equal('"test"')
        })

        it("correctly stringifies to the correct value as a child", () => {
            const obj = {prop: m.prop("test")}
            expect(JSON.stringify(obj)).to.equal('{"prop":"test"}')
        })

        it("correctly wraps Mithril promises", () => {
            const deferred = m.deferred()
            const prop = m.prop(deferred.promise)
            deferred.resolve("test")
            expect(prop()).to.equal("test")
        })

        it("returns a thenable when wrapping a Mithril promise", () => {
            const deferred = m.deferred()
            const prop = m.prop(deferred.promise).then(() => "test2")
            deferred.resolve("test")
            expect(prop()).to.equal("test2")
        })
    })
})
