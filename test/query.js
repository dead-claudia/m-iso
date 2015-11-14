import {buildQueryString, parseQueryString} from "../src/query.js"

import {expect} from "chai"

describe("query", () => {
    describe("buildQueryString()", () => {
        it("exists", () => {
            expect(buildQueryString).to.be.a("function")
        })

        it("converts an empty object to an empty string", () => {
            expect(buildQueryString({})).to.equal("")
        })

        it("converts an object into a correct query string", () => {
            expect(
                buildQueryString({
                    foo: "bar",
                    hello: ["world", "mars", "mars"],
                    world: {
                        test: 3,
                    },
                    bam: "",
                    yup: null,
                    removed: undefined,
                })
            ).to.equal(
                "foo=bar&hello=world&hello=mars&world%5Btest%5D=3&bam=&yup"
            )
        })
    })

    describe("parseQueryString()", () => {
        it("exists", () => {
            expect(parseQueryString).to.be.a("function")
        })

        it("parses an empty string as an empty object", () => {
            const args = parseQueryString("")
            expect(args).to.eql({})
        })

        it("parses multiple parameters correctly", () => {
            const args = parseQueryString("foo=bar&hello=world&hello=mars" +
                "&bam=&yup")

            expect(args).to.eql({
                foo: "bar",
                hello: ["world", "mars"],
                bam: "",
                yup: null,
            })
        })

        it("parses escapes correctly", () => {
            const args = parseQueryString("foo=bar&hello%5B%5D=world&" +
                "hello%5B%5D=mars&hello%5B%5D=pluto")

            expect(args).to.eql({
                foo: "bar",
                "hello[]": ["world", "mars", "pluto"],
            })
        })
    })
})
