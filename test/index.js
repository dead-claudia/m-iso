"use strict"

var m = require("../lib/index.js")
var expect = require("chai").expect

describe("exports", function () {
    it("exists", function () {
        expect(m).to.be.a("function")
    })

    it("has m.r()", function () {
        expect(m.r).to.be.a("function")
    })

    it("has m.component()", function () {
        expect(m.component).to.be.a("function")
    })

    it("has m.render()", function () {
        expect(m.render).to.be.a("function")
    })

    it("has m.deferred()", function () {
        expect(m.deferred).to.be.a("function")
    })

    it("has m.prop()", function () {
        expect(m.prop).to.be.a("function")
    })

    it("has m.sync()", function () {
        expect(m.sync).to.be.a("function")
    })
})
