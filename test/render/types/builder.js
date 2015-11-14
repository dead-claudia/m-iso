import Builder from "../../../src/render/types/builder.js"
import Wrapper from "../../../src/render/hooks.js"

import m, {trust as mtrust} from "../../../src/constructor.js"
import {n, trust as rtrust, types} from "../../../src/render/renderer.js"
import {hash} from "../../../src/util.js"

// import * as sinon from "sinon"
import chai, {expect} from "chai"
import sinonChai from "sinon-chai"
chai.use(sinonChai)

describe("render/types/builder default class Builder()", () => {
    it("works", () => {
        expect(Builder).to.be.a("function")
    })

    const FakeHTMLRenderer = {
        print: item => item,

        check() {
            // xml
            return {
                type: types.html,
                void: false,
            }
        },

        subtree: hash(),
        aliases: hash(),
    }

    const FakeXMLRenderer = {
        print(item) {
            return item
        },

        check() {
            // xml
            return {
                type: types.xml,
                void: false,
            }
        },

        subtree: hash(),
        aliases: hash(),
    }

    function makeBuilder(renderer) {
        // The XML renderer is the simplest, as it just returns constants.
        if (renderer == null) renderer = FakeXMLRenderer
        return new Builder(renderer, [], new Wrapper({}))
    }

    it("can construct a Builder", () => {
        expect(makeBuilder()).to.be.an.instanceof(Builder)
    })

    it("renders strings correctly", () => {
        expect(makeBuilder().render("string")).to.equal("string")
    })

    it("renders trusted strings correctly", () => {
        expect(makeBuilder().render(mtrust("string")))
            .to.eql(rtrust("string"))
    })

    it("renders arrays correctly", () => {
        expect(makeBuilder().render(["foo", "bar"]))
            .to.eql(["foo", "bar"])
    })

    it("renders nodes correctly", () => {
        expect(makeBuilder().render(m(".foo", {foo: "bar"}, "foo")))
            .to.eql(n(
                types.xml,
                "div",
                [["foo", "bar"], ["className", "foo"]],
                ["foo"]
            ))
    })

    it("renders nested nodes correctly", () => {
        expect(makeBuilder().render(m(".foo", {foo: "bar"}, "foo", m(".bar"))))
            .to.eql(n(
                types.xml,
                "div",
                [["foo", "bar"], ["className", "foo"]],
                [
                    "foo",
                    n(
                        types.xml,
                        "div",
                        [["className", "bar"]],
                        []),
                ]))
    })

    it("renders nested nodes with trusted ones correctly", () => {
        expect(makeBuilder().render(
            m(".foo", {foo: "bar"}, "foo", m(".bar", mtrust("baz")))
        )).to.eql(n(
            types.xml,
            "div",
            [["foo", "bar"], ["className", "foo"]],
            [
                "foo",
                n(
                    types.xml,
                    "div",
                    [["className", "bar"]],
                    [rtrust("baz")]),
            ]))
    })

    it("doesn't itself HTML/XML escape the body", () => {
        expect(makeBuilder().render(mtrust('<foo id="id">&lt;</foo>')))
            .to.eql(rtrust('<foo id="id">&lt;</foo>'))
        expect(makeBuilder(FakeHTMLRenderer)
            .render(mtrust('<foo id="id">&lt;</foo>')))
            .to.eql(rtrust('<foo id="id">&lt;</foo>'))
    })

    it("doesn't itself HTML/XML escape the attributes", () => {
        expect(makeBuilder(FakeHTMLRenderer)
            .render(m("div", {id: '<foo id="id">&lt;</foo>'})))
            .to.eql(n(
                types.html,
                "div",
                [["id", '<foo id="id">&lt;</foo>']],
                []))
    })

    context("hooks", () => {
        it("permits a `print` hook", () => {
            expect(
                new Builder(FakeXMLRenderer, [], new Wrapper({print: () => 1}))
                    .render(m("div", "foo"))
            ).to.eql(n(types.xml, "div", [], ["1"]))
        })
    })

    context("Subtree", () => {
        it("can trust from subtrees", () => {
            expect(makeBuilder({
                print: item => item,

                check() {
                    // xml
                    return {
                        type: types.xml,
                        void: false,
                    }
                },

                subtree: hash({
                    div() {
                        return this.str("foo")
                    },
                }),

                aliases: hash(),
            }).render(m("div", "foo"))).to.eql(rtrust("foo"))
        })

        it("can build with new renderers from subtrees", () => {
            expect(makeBuilder({
                print: item => item,

                check() {
                    // xml
                    return {
                        type: types.xml,
                        void: false,
                    }
                },

                subtree: hash({
                    div(node) {
                        return this.render(FakeHTMLRenderer, node, [])
                    },
                }),

                aliases: hash(),
            }).render(m("span", m("div", m("foo")))))
            .to.eql(n(types.xml, "span", [], [
                n(types.html, "div", [], [n(types.html, "foo", [], [])]),
            ]))
        })
    })

    it("uses correct `print` method", () => {
        expect(makeBuilder({
            print: () => "10",

            check() {
                // xml
                return {
                    type: types.xml,
                    void: false,
                }
            },

            subtree: hash(),
            aliases: hash(),
        }).render(m("div", "foo"))).to.eql(n(types.xml, "10", [], ["foo"]))
    })

    it("doesn't iterate if `check` return true", () => {
        expect(makeBuilder({
            print: item => item,

            check() {
                // xml
                return {
                    type: types.xml,
                    void: true,
                }
            },

            subtree: hash(),
            aliases: hash(),
        }).render(m("div", "foo"))).to.eql(n(types.xml, "div", [], []))
    })

    it("follows aliases", () => {
        expect(makeBuilder({
            print: item => item,

            check() {
                // xml
                return {
                    type: types.xml,
                    void: false,
                }
            },

            subtree: hash(),
            aliases: hash({className: "class"}),
        }).render(m(".foo", "foo")))
        .to.eql(n(types.xml, "div", [["class", "foo"]], ["foo"]))
    })
})
