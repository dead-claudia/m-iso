import getType, * as t from "../../../src/render/types/index.js"

import m from "../../../src/constructor.js"
import {types, trust} from "../../../src/render/renderer.js"

import * as sinon from "sinon"
import chai, {expect} from "chai"
import sinonChai from "sinon-chai"
chai.use(sinonChai)

describe("render/types/index", () => {
    describe("default getType()", () => {
        it("exists", () => {
            expect(getType).to.be.a("function")
        })

        it("gets the default renderer", () => {
            expect(getType(null)).to.eql({
                voids: [],
                renderer: t.DefaultRenderer,
            })

            expect(getType(undefined)).to.eql({
                voids: [],
                renderer: t.DefaultRenderer,
            })

            expect(getType()).to.eql({
                voids: [],
                renderer: t.DefaultRenderer,
            })
        })

        it("gets html renderer", () => {
            expect(getType("html")).to.equal(t.types.html)
        })

        it("gets html-polyglot renderer", () => {
            expect(getType("html-polyglot")).to.equal(t.types["html-polyglot"])
        })

        it("gets html4 renderer", () => {
            expect(getType("html4")).to.equal(t.types.html4)
        })

        it("gets xhtml renderer", () => {
            expect(getType("xhtml")).to.equal(t.types.xhtml)
        })

        it("gets xml renderer", () => {
            expect(getType("xml")).to.equal(t.types.xml)
        })

        it("rejects anything else", () => {
            expect(() => getType("unknown")).to.throw()
        })
    })

    function makeSubtree(renderer) {
        return {
            render: renderer,
            str: trust,
        }
    }

    function callSubtree(renderer, name, arg) {
        const sentinel = {}
        const spy = sinon.stub().returns(sentinel)
        const subtree = makeSubtree(spy)
        const node = typeof name === "string" ? m(name) : name

        if (typeof name !== "string") name = name.tag

        return {
            spy, subtree, node, sentinel,
            value: renderer.subtree[name].call(subtree, node, arg, renderer),
        }
    }

    function calledWithExactly(spy, inst, ...args) {
        expect(spy).to.be.calledWithExactly(...args)
        expect(spy).to.be.calledOn(inst)
    }

    describe("SVGRenderer", () => {
        it("exists", () => {
            expect(t.SVGRenderer).to.be.an("object")
        })

        it("doesn't modify tag names", () => {
            expect(t.SVGRenderer.print("foo")).to.equal("foo")
            expect(t.SVGRenderer.print("Foo")).to.equal("Foo")
            expect(t.SVGRenderer.print("FOO")).to.equal("FOO")
        })

        it("checks as XML", () => {
            expect(t.SVGRenderer.check(m("path"), [])).to.eql({
                type: types.xml,
                void: false,
            })
        })

        it("has the correct `subtree` keys", () => {
            expect(t.SVGRenderer.subtree).to.have.all.keys(["foreignObject"])
            expect(t.SVGRenderer.subtree.foreignObject).to.be.a("function")
        })

        it("has the correct `aliases`", () => {
            expect(t.SVGRenderer.aliases).to.eql({
                className: "class",
            })
        })

        it("creates the correct foreignObject", () => {
            const args = {voids: [], parent: {}}
            const {voids, parent} = args
            const r = callSubtree(t.SVGRenderer, "foreignObject", args)
            expect(r.value).to.equal(r.sentinel)
            calledWithExactly(r.spy, r.subtree, parent, r.node, voids)
        })

        it("has the correct prototype for `subtree`", () => {
            expect(t.SVGRenderer.subtree).to.not.be.an.instanceof(Object)
        })

        it("has the correct prototype for `aliases`", () => {
            expect(t.SVGRenderer.aliases).to.not.be.an.instanceof(Object)
        })
    })

    describe("XMLRenderer", () => {
        it("exists", () => {
            expect(t.XMLRenderer).to.be.an("object")
        })

        it("doesn't modify tag names", () => {
            expect(t.XMLRenderer.print("foo")).to.equal("foo")
            expect(t.XMLRenderer.print("Foo")).to.equal("Foo")
            expect(t.XMLRenderer.print("FOO")).to.equal("FOO")
        })

        it("checks as XML", () => {
            expect(t.XMLRenderer.check(m("path"), [])).to.eql({
                type: types.xml,
                void: false,
            })
        })

        it("has the correct `subtree` keys", () => {
            expect(t.XMLRenderer.subtree).to.have.all.keys(["!CDATA"])
            expect(t.XMLRenderer.subtree["!CDATA"]).to.be.a("function")
        })

        it("has no `aliases`, but the property exists", () => {
            expect(t.XMLRenderer.aliases).to.be.an("object").and.empty
        })

        it("has the correct prototype for `subtree`", () => {
            expect(t.XMLRenderer.subtree).to.not.be.an.instanceof(Object)
        })

        it("has the correct prototype for `aliases`", () => {
            expect(t.XMLRenderer.aliases).to.not.be.an.instanceof(Object)
        })

        it("correctly renders a single CDATA string", () => {
            const {value} = callSubtree(t.XMLRenderer, m("!CDATA", "foo"))
            expect(value).to.eql(trust("<![CDATA[foo]]>"))
        })

        it("correctly renders a CDATA array", () => {
            const node = m("!CDATA", "foo", "bar")
            const {value} = callSubtree(t.XMLRenderer, node)
            expect(value).to.eql(trust("<![CDATA[foobar]]>"))
        })

        it("correctly renders a nested CDATA array", () => {
            const node = m("!CDATA", "foo", ["bar"],
                [[["baz"], "quux"], "spam", ["eggs"]])
            const {value} = callSubtree(t.XMLRenderer, node)
            expect(value).to.eql(trust("<![CDATA[foobarbazquuxspameggs]]>"))
        })

        it("doesn't escape CDATA characters", () => {
            const node = m("!CDATA", `<foo id='bar' name="baz">&lt;</foo>`)
            const {value} = callSubtree(t.XMLRenderer, node)
            expect(value).to.eql(trust(
                `<![CDATA[<foo id='bar' name="baz">&lt;</foo>]]>`
            ))
        })
    })

    describe("HTMLRenderer", () => {
        it("exists", () => {
            expect(t.HTMLRenderer).to.be.an("object")
        })

        it("lowercases tag names", () => {
            expect(t.HTMLRenderer.print("foo")).to.equal("foo")
            expect(t.HTMLRenderer.print("Foo")).to.equal("foo")
            expect(t.HTMLRenderer.print("FOO")).to.equal("foo")
        })

        it("correctly determines void HTML tags", () => {
            expect(t.HTMLRenderer.check(m("div"), ["div"])).to.eql({
                type: types.htmlVoid,
                void: true,
            })
        })

        it("correctly determines non-void HTML tags", () => {
            expect(t.HTMLRenderer.check(m("div"), [])).to.eql({
                type: types.html,
                void: false,
            })
        })

        it("has the correct prototype for `subtree`", () => {
            expect(t.HTMLRenderer.subtree).to.not.be.an.instanceof(Object)
        })

        it("has the correct prototype for `aliases`", () => {
            expect(t.HTMLRenderer.aliases).to.not.be.an.instanceof(Object)
        })

        it("has the correct `subtree` keys", () => {
            expect(t.HTMLRenderer.subtree).to.have.all.keys([
                "!cdata",
                "svg",
                "math",
            ])
            expect(t.HTMLRenderer.subtree["!cdata"]).to.be.a("function")
            expect(t.HTMLRenderer.subtree.svg).to.be.a("function")
            expect(t.HTMLRenderer.subtree.math).to.be.a("function")
        })

        it("has the correct `aliases`", () => {
            expect(t.HTMLRenderer.aliases).to.eql({className: "class"})
        })

        it("correctly renders a single CDATA string", () => {
            const {value} = callSubtree(t.HTMLRenderer, m("!cdata", "foo"))
            expect(value).to.eql(trust("<![CDATA[foo]]>"))
        })

        it("correctly renders a CDATA array", () => {
            const node = m("!cdata", "foo", "bar")
            const {value} = callSubtree(t.HTMLRenderer, node)
            expect(value).to.eql(trust("<![CDATA[foobar]]>"))
        })

        it("correctly renders a nested CDATA array", () => {
            const node = m("!cdata", "foo", ["bar"],
                [[["baz"], "quux"], "spam", ["eggs"]])
            const {value} = callSubtree(t.HTMLRenderer, node)
            expect(value).to.eql(trust("<![CDATA[foobarbazquuxspameggs]]>"))
        })

        it("doesn't escape CDATA characters", () => {
            const node = m("!cdata", `<foo id='bar' name="baz">&lt;</foo>`)
            const {value} = callSubtree(t.HTMLRenderer, node)
            expect(value).to.eql(trust(
                `<![CDATA[<foo id='bar' name="baz">&lt;</foo>]]>`
            ))
        })

        it("renders the right info for SVG elements", () => {
            const voids = []
            const r = callSubtree(t.HTMLRenderer, "svg", voids)
            expect(r.value).to.equal(r.sentinel)
            expect(r.spy).to.be.calledOn(r.subtree)
            expect(r.spy).to.be.calledWithMatch(
                sinon.match.same(t.SVGRenderer),
                sinon.match.same(r.node),
                sinon.match({
                    parent: sinon.match.same(t.HTMLRenderer),
                    voids: sinon.match.same(voids),
                })
            )
        })

        it("renders the right info for math elements", () => {
            const voids = []
            const r = callSubtree(t.HTMLRenderer, "math", voids)
            expect(r.value).to.equal(r.sentinel)
            expect(r.spy).to.be.calledOn(r.subtree)
            expect(r.spy).to.be.calledWithMatch(
                sinon.match.same(t.XMLRenderer),
                sinon.match.same(r.node),
                []
            )
        })
    })

    describe("XHTMLRenderer", () => {
        it("exists", () => {
            expect(t.XHTMLRenderer).to.be.an("object")
        })

        it("doesn't change tag names", () => {
            expect(t.XHTMLRenderer.print("foo")).to.equal("foo")
            expect(t.XHTMLRenderer.print("Foo")).to.equal("Foo")
            expect(t.XHTMLRenderer.print("FOO")).to.equal("FOO")
        })

        it("correctly determines void XHTML tags", () => {
            expect(t.XHTMLRenderer.check(m("div"), ["div"])).to.eql({
                type: types.xml,
                void: true,
            })
        })

        it("correctly determines non-void XHTML tags", () => {
            expect(t.XHTMLRenderer.check(m("div"), [])).to.eql({
                type: types.xmlEnd,
                void: false,
            })
        })

        it("has the correct prototype for `subtree`", () => {
            expect(t.XHTMLRenderer.subtree).to.not.be.an.instanceof(Object)
        })

        it("has the correct prototype for `aliases`", () => {
            expect(t.XHTMLRenderer.aliases).to.not.be.an.instanceof(Object)
        })

        it("has the correct `subtree` keys", () => {
            expect(t.XHTMLRenderer.subtree).to.have.all.keys([
                "!CDATA",
                "svg",
                "math",
            ])
            expect(t.XHTMLRenderer.subtree["!CDATA"]).to.be.a("function")
            expect(t.XHTMLRenderer.subtree.svg).to.be.a("function")
            expect(t.XHTMLRenderer.subtree.math).to.be.a("function")
        })

        it("has the correct `aliases`", () => {
            expect(t.XHTMLRenderer.aliases).to.eql({className: "class"})
        })

        it("correctly renders a single CDATA string", () => {
            const {value} = callSubtree(t.XHTMLRenderer, m("!CDATA", "foo"))
            expect(value).to.eql(trust("<![CDATA[foo]]>"))
        })

        it("correctly renders a CDATA array", () => {
            const node = m("!CDATA", "foo", "bar")
            const {value} = callSubtree(t.XHTMLRenderer, node)
            expect(value).to.eql(trust("<![CDATA[foobar]]>"))
        })

        it("correctly renders a nested CDATA array", () => {
            const node = m("!CDATA", "foo", ["bar"],
                [[["baz"], "quux"], "spam", ["eggs"]])
            const {value} = callSubtree(t.XHTMLRenderer, node)
            expect(value).to.eql(trust("<![CDATA[foobarbazquuxspameggs]]>"))
        })

        it("doesn't escape CDATA characters", () => {
            const node = m("!CDATA", `<foo id='bar' name="baz">&lt;</foo>`)
            const {value} = callSubtree(t.XHTMLRenderer, node)
            expect(value).to.eql(trust(
                `<![CDATA[<foo id='bar' name="baz">&lt;</foo>]]>`
            ))
        })

        it("renders the right info for SVG elements", () => {
            const voids = []
            const r = callSubtree(t.XHTMLRenderer, "svg", voids)
            expect(r.value).to.equal(r.sentinel)
            expect(r.spy).to.be.calledOn(r.subtree)
            expect(r.spy).to.be.calledWithMatch(
                sinon.match.same(t.SVGRenderer),
                sinon.match.same(r.node),
                sinon.match({
                    parent: sinon.match.same(t.XHTMLRenderer),
                    voids: sinon.match.same(voids),
                })
            )
        })

        it("renders the right info for math elements", () => {
            const voids = []
            const r = callSubtree(t.XHTMLRenderer, "math", voids)
            expect(r.value).to.equal(r.sentinel)
            expect(r.spy).to.be.calledOn(r.subtree)
            expect(r.spy).to.be.calledWithMatch(
                sinon.match.same(t.XMLRenderer),
                sinon.match.same(r.node),
                []
            )
        })
    })

    describe("DefaultRenderer", () => {
        it("exists", () => {
            expect(t.DefaultRenderer).to.be.an("object")
        })

        it("doesn't modify tag names", () => {
            expect(t.DefaultRenderer.print("foo")).to.equal("foo")
            expect(t.DefaultRenderer.print("Foo")).to.equal("Foo")
            expect(t.DefaultRenderer.print("FOO")).to.equal("FOO")
        })

        it("checks as XML", () => {
            expect(t.DefaultRenderer.check(m("path"), [])).to.eql({
                type: types.xml,
                void: false,
            })
        })

        it("has the correct `subtree` keys", () => {
            expect(t.DefaultRenderer.subtree).to.be.an("object").and.empty
        })

        it("has no `aliases`, but the property exists", () => {
            expect(t.DefaultRenderer.aliases).to.be.an("object").and.empty
        })

        it("has the correct prototype for `subtree`", () => {
            expect(t.DefaultRenderer.subtree).to.not.be.an.instanceof(Object)
        })

        it("has the correct prototype for `aliases`", () => {
            expect(t.DefaultRenderer.aliases).to.not.be.an.instanceof(Object)
        })
    })
})
