"use strict"

var util = require("../lib/util.js")

var chai = require("chai")
var sinon = require("sinon")
chai.use(require("sinon-chai"))
var expect = chai.expect

// This contains mostly sanity tests
describe("util", function () {
    describe("hasOwn()", function () {
        it("exists", function () {
            expect(util.hasOwn).to.be.a("function")
        })

        it("correctly tells properties that exist", function () {
            expect(util.hasOwn({foo: 1}, "foo")).to.be.true
        })

        it("correctly tells properties that don't exist", function () {
            expect(util.hasOwn({foo: 1}, "bar")).to.be.false
        })

        it("correctly tells inherited properties", function () {
            expect(util.hasOwn(Object.create({foo: 1}), "foo")).to.be.false
        })
    })

    describe("noop()", function () {
        it("exists", function () {
            expect(util.noop).to.be.a("function")
        })

        it("returns undefined", function () {
            expect(util.noop()).to.be.undefined
        })
    })

    describe("identity()", function () {
        it("exists", function () {
            expect(util.identity).to.be.a("function")
        })

        it("returns the object put into it", function () {
            var obj = {}
            expect(util.identity(obj)).to.equal(obj)
        })
    })

    describe("isObject()", function () {
        it("exists", function () {
            expect(util.isObject).to.be.a("function")
        })

        it("correctly checks plain objects", function () {
            expect(util.isObject({})).to.be.true
        })

        it("correctly checks arrays", function () {
            expect(util.isObject([])).to.be.false
        })

        it("correctly checks `null`s", function () {
            expect(util.isObject(null)).to.be.false
        })

        it("correctly checks `undefined`s", function () {
            expect(util.isObject(undefined)).to.be.false
        })

        it("works without arguments", function () {
            expect(util.isObject()).to.be.false
        })
    })

    describe("assign()", function () {
        it("exists", function () {
            expect(util.assign).to.be.a("function")
        })

        it("mutates the destination object", function () {
            var obj = {}
            util.assign(obj, {foo: 1})
            expect(obj).to.eql({foo: 1})
        })

        it("adds several properties", function () {
            var obj = {}
            util.assign(obj, {
                foo: 1,
                bar: 2
            })

            expect(obj).to.eql({
                foo: 1,
                bar: 2
            })
        })

        it("only adds properties", function () {
            var obj = {foo: 1}
            util.assign(obj, {bar: 2})
            expect(obj).to.eql({
                foo: 1,
                bar: 2
            })
        })

        it("overwrites existing properties", function () {
            var obj = {foo: 1}
            util.assign(obj, {foo: 2})
            expect(obj).to.eql({foo: 2})
        })

        it("returns the host object", function () {
            var obj = {}
            expect(util.assign(obj, {foo: 1})).to.equal(obj)
        })

        it("accepts three arguments", function () {
            var obj = {}
            util.assign(obj, {foo: 1}, {bar: 2})
            expect(obj).to.eql({foo: 1, bar: 2})
        })

        it("overwrites previously added properties with three arguments", function () { // eslint-disable-line max-len
            var obj = {}
            util.assign(obj, {foo: 1}, {foo: 2})
            expect(obj).to.eql({foo: 2})
        })

        it("accepts many arguments", function () {
            var obj = {}
            util.assign(obj, {foo: 1}, {bar: 2}, {baz: 3}, {quux: 4})
            expect(obj).to.eql({foo: 1, bar: 2, baz: 3, quux: 4})
        })

        it("overwrites previously added properties with many arguments", function () { // eslint-disable-line max-len
            var obj = {}
            util.assign(obj, {foo: 1}, {foo: 2}, {bar: 3}, {foo: 4, bar: 5})
            expect(obj).to.eql({foo: 4, bar: 5})
        })

        it("doesn't bind functions", function () {
            var foo = sinon.spy()
            var bar = sinon.spy()
            var obj = {foo: foo}

            util.assign(obj, {bar: bar})

            obj.foo()
            expect(foo).to.been.calledOn(obj)

            obj.bar()
            expect(bar).to.been.calledOn(obj)
        })
    })

    describe("d()", function () {
        it("exists", function () {
            expect(util.d).to.be.a("function")
        })

        it("works with existing values", function () {
            var a = {}
            var b = {}
            expect(util.d(a, b)).to.equal(a)
        })

        it("works with `null`", function () {
            var obj = {}
            expect(util.d(null, obj)).to.equal(obj)
        })

        it("works with `undefined`", function () {
            var obj = {}
            expect(util.d(undefined, obj)).to.equal(obj)
        })
    })
})
