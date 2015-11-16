import Wrapper from "../../debug/render/hooks.js"

import {expect} from "chai"

describe("render/hooks default class Wrapper()", () => {
    it("exists", () => {
        expect(Wrapper).to.be.a("function")
    })

    it("gets the correct hook for `print`", () => {
        expect(new Wrapper({
            print() {
                return "bar"
            },
        }).get("print")("foo")).to.equal("bar")
    })

    it("gets the correct default hook for `print`", () => {
        expect(new Wrapper({}).get("print")("foo")).to.equal("foo")
    })
})
