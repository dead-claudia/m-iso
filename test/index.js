import m from "../debug/index.js"

import {expect} from "chai"

describe("exports", () => {
    it("exists", () => {
        expect(m).to.be.a("function")
    })

    it("has m.r()", () => {
        expect(m.r).to.be.a("function")
    })

    it("has m.component()", () => {
        expect(m.component).to.be.a("function")
    })

    it("has m.render()", () => {
        expect(m.render).to.be.a("function")
    })

    // TODO: implement this
    xit("has m.route()", () => {
        expect(m.route).to.be.a("function")
    })

    it("has m.route.buildQueryString()", () => {
        expect(m.route.buildQueryString).to.be.a("function")
    })

    it("has m.route.parseQueryString()", () => {
        expect(m.route.parseQueryString).to.be.a("function")
    })

    it("has m.deferred()", () => {
        expect(m.deferred).to.be.a("function")
    })

    it("has m.prop()", () => {
        expect(m.prop).to.be.a("function")
    })

    it("has m.sync()", () => {
        expect(m.sync).to.be.a("function")
    })
})
