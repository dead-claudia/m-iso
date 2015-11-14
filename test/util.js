import * as util from "../src/util.js"

import chai, {expect} from "chai"
import * as sinon from "sinon"
import sinonChai from "sinon-chai"
chai.use(sinonChai)

// This contains mostly sanity tests
describe("util", () => {
    describe("hasOwn()", () => {
        it("exists", () => {
            expect(util.hasOwn).to.be.a("function")
        })

        it("correctly tells properties that exist", () => {
            expect(util.hasOwn({foo: 1}, "foo")).to.be.true
        })

        it("correctly tells properties that don't exist", () => {
            expect(util.hasOwn({foo: 1}, "bar")).to.be.false
        })

        it("correctly tells inherited properties", () => {
            expect(util.hasOwn(Object.create({foo: 1}), "foo")).to.be.false
        })
    })

    describe("forOwn()", () => {
        it("exists", () => {
            expect(util.forOwn).to.be.a("function")
        })

        function makeSpy(values) {
            return sinon.spy((value, key) => { values[key] = value })
        }

        it("iterates the keys and values", () => {
            const values = {}
            const spy = makeSpy(values)

            util.forOwn({foo: 1, bar: 2, baz: 3}, spy)
            expect(values).to.eql({foo: 1, bar: 2, baz: 3})
            expect(spy).to.have.been.calledThrice
        })

        it("doesn't iterate inherited keys", () => {
            const object = Object.create({foo: 1, bar: 2, baz: 3})
            const values = {}
            const spy = makeSpy(values)

            util.forOwn(object, spy)

            expect(values).to.eql({})
            expect(spy).to.not.have.been.called
        })

        it("does not call the function with `this`", () => {
            const spy = sinon.spy()
            util.forOwn({foo: 1, bar: 2, baz: 3}, spy)
            expect(spy).to.have.always.been.calledOn(undefined)
        })

        it("only calls the function with two arguments each time", () => {
            const lengths = []

            util.forOwn({foo: 1, bar: 2, baz: 3}, function () {
                lengths.push(arguments.length)
            })

            expect(lengths).to.eql([2, 2, 2])
        })

        it("returns the input object", () => {
            const list = {foo: 1, bar: 2, baz: 3}
            const ret = util.forOwn(list, () => {})

            expect(ret).to.equal(list)
        })

        it("ends iteration when function returns `false`", () => {
            let count = 0
            const spy = sinon.spy(() => {
                if (count++ === 1) return false
            })

            util.forOwn({foo: 1, bar: 2, baz: 3}, spy)
            expect(spy).to.have.been.calledTwice
        })

        it("doesn't end iteration when given anything else", () => {
            const ret = {}
            const object = {}

            const list = [
                true, undefined, null, 1, 0, "", "foo", {}, [],
                () => {},
                {valueOf: () => false},
            ]

            if (typeof Symbol === "function") list.push(Symbol())

            list.forEach((value, i) => { object[i] = value })

            const spy = makeSpy(ret)

            util.forOwn(object, spy)

            expect(spy).to.have.callCount(list.length)
        })
    })

    describe("noop()", () => {
        it("exists", () => {
            expect(util.noop).to.be.a("function")
        })

        it("returns undefined", () => {
            expect(util.noop()).to.be.undefined
        })

        it("is constructible", () => {
            expect(() => new util.noop()).to.not.throw()
        })
    })

    describe("identity()", () => {
        it("exists", () => {
            expect(util.identity).to.be.a("function")
        })

        it("returns the object put into it", () => {
            const obj = {}
            expect(util.identity(obj)).to.equal(obj)
        })
    })

    describe("isObject()", () => {
        it("exists", () => {
            expect(util.isObject).to.be.a("function")
        })

        it("correctly checks plain objects", () => {
            expect(util.isObject({})).to.be.true
        })

        it("correctly checks arrays", () => {
            expect(util.isObject([])).to.be.false
        })

        it("correctly checks `null`s", () => {
            expect(util.isObject(null)).to.be.false
        })

        it("correctly checks `undefined`s", () => {
            expect(util.isObject(undefined)).to.be.false
        })

        it("works without arguments", () => {
            expect(util.isObject()).to.be.false
        })
    })

    describe("assign()", () => {
        it("exists", () => {
            expect(util.assign).to.be.a("function")
        })

        it("mutates the destination object", () => {
            const obj = {}
            util.assign(obj, {foo: 1})
            expect(obj).to.eql({foo: 1})
        })

        it("adds several properties", () => {
            const obj = {}
            util.assign(obj, {
                foo: 1,
                bar: 2,
            })

            expect(obj).to.eql({
                foo: 1,
                bar: 2,
            })
        })

        it("only adds properties", () => {
            const obj = {foo: 1}
            util.assign(obj, {bar: 2})
            expect(obj).to.eql({
                foo: 1,
                bar: 2,
            })
        })

        it("overwrites existing properties", () => {
            const obj = {foo: 1}
            util.assign(obj, {foo: 2})
            expect(obj).to.eql({foo: 2})
        })

        it("returns the host object", () => {
            const obj = {}
            expect(util.assign(obj, {foo: 1})).to.equal(obj)
        })

        it("accepts three arguments", () => {
            const obj = {}
            util.assign(obj, {foo: 1}, {bar: 2})
            expect(obj).to.eql({foo: 1, bar: 2})
        })

        it("overwrites previously added properties with three arguments", () => { // eslint-disable-line max-len
            const obj = {}
            util.assign(obj, {foo: 1}, {foo: 2})
            expect(obj).to.eql({foo: 2})
        })

        it("accepts many arguments", () => {
            const obj = {}
            util.assign(obj, {foo: 1}, {bar: 2}, {baz: 3}, {quux: 4})
            expect(obj).to.eql({foo: 1, bar: 2, baz: 3, quux: 4})
        })

        it("overwrites previously added properties with many arguments", () => {
            const obj = {}
            util.assign(obj, {foo: 1}, {foo: 2}, {bar: 3}, {foo: 4, bar: 5})
            expect(obj).to.eql({foo: 4, bar: 5})
        })

        it("doesn't bind functions", () => {
            const foo = sinon.spy()
            const bar = sinon.spy()
            const obj = {foo}

            util.assign(obj, {bar})

            obj.foo()
            expect(foo).to.been.calledOn(obj)

            obj.bar()
            expect(bar).to.been.calledOn(obj)
        })
    })

    describe("d()", () => {
        it("exists", () => {
            expect(util.d).to.be.a("function")
        })

        it("works with existing values", () => {
            const a = {}
            const b = {}
            expect(util.d(a, b)).to.equal(a)
        })

        it("works with `null`", () => {
            const obj = {}
            expect(util.d(null, obj)).to.equal(obj)
        })

        it("works with `undefined`", () => {
            const obj = {}
            expect(util.d(undefined, obj)).to.equal(obj)
        })
    })

    describe("forEach()", () => {
        it("exists", () => {
            expect(util.forEach).to.be.a("function")
        })

        it("iterates the values in order", () => {
            const values = []

            util.forEach(["1", "2", "3", "4", "5", "6"], value => {
                values.push(value)
            })

            expect(values).to.eql(["1", "2", "3", "4", "5", "6"])
        })

        it("iterates the indices in order", () => {
            const indices = []

            util.forEach(["1", "2", "3", "4", "5", "6"], (_, i) => {
                indices.push(i)
            })

            expect(indices).to.eql([0, 1, 2, 3, 4, 5])
        })

        it("does not call the function with `this`", () => {
            const instances = []

            util.forEach(["1", "2", "3", "4", "5", "6"], function () {
                instances.push(this) // eslint-disable-line no-invalid-this
            })

            expect(instances).to.eql([
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
            ])
        })

        it("only calls the function with two arguments each time", () => {
            const lengths = []

            util.forEach(["1", "2", "3", "4", "5", "6"], function () {
                lengths.push(arguments.length)
            })

            expect(lengths).to.eql([2, 2, 2, 2, 2, 2])
        })

        it("returns the input list", () => {
            const list = ["1", "2", "3", "4", "5", "6"]
            const ret = util.forEach(list, () => {})

            expect(ret).to.equal(list)
        })

        it("ends iteration when function returns `false`", () => {
            const ret = []
            util.forEach([1, 2, 3, 4, 5], i => {
                if (i > 3) return false
                ret.push(i)
            })
            expect(ret).to.eql([1, 2, 3])
        })

        it("doesn't end iteration when given anything else", () => {
            const ret = []

            const list = [
                true, undefined, null, 1, 0, "", "foo", {}, [],
                function () {},
                {valueOf: () => false},
            ]

            if (typeof Symbol === "function") list.push(Symbol())

            util.forEach(list, i => {
                ret.push(i)
                return i
            })

            expect(ret).to.eql(list)
        })
    })

    describe("hash()", () => {
        it("exists", () => {
            expect(util.hash).to.be.a("function")
        })

        it("creates a plain object with `undefined` parent", () => {
            expect(Object.getPrototypeOf(util.hash())).to.be.null
        })

        it("creates a plain object with `undefined` parent", () => {
            expect(util.hash({a: 1})).to.contain.all.keys({a: 1})
        })

        it("does not inherit from its parent", () => {
            expect(util.hash()).to.not.have.property("toString")
        })
    })
})
