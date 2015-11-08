"use strict"

var q = require("../lib/query.js")

var expect = require("chai").expect

describe("m.route.buildQueryString()", function () {
    it("exists", function () {
        expect(q.buildQueryString).to.be.a("function")
    })

    it("converts an empty object to an empty string", function () {
        expect(q.buildQueryString({})).to.equal("")
    })

    it("converts an object into a correct query string", function () {
        expect(
            q.buildQueryString({
                foo: "bar",
                hello: ["world", "mars", "mars"],
                world: {
                    test: 3
                },
                bam: "",
                yup: null,
                removed: undefined
            })
        ).to.equal("foo=bar&hello=world&hello=mars&world%5Btest%5D=3&bam=&yup")
    })
})

describe("m.route.parseQueryString()", function () {
    it("exists", function () {
        expect(q.parseQueryString).to.be.a("function")
    })

    it("parses an empty string as an empty object", function () {
        var args = q.parseQueryString("")
        expect(args).to.eql({})
    })

    it("parses multiple parameters correctly", function () {
        var args = q.parseQueryString("foo=bar&hello=world&hello=mars" +
            "&bam=&yup")

        expect(args).to.eql({
            foo: "bar",
            hello: ["world", "mars"],
            bam: "",
            yup: null
        })
    })

    it("parses escapes correctly", function () {
        var args = q.parseQueryString("foo=bar&hello%5B%5D=world&" +
            "hello%5B%5D=mars&hello%5B%5D=pluto")

        expect(args).to.eql({
            foo: "bar",
            "hello[]": ["world", "mars", "pluto"]
        })
    })
})
