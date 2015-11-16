import * as renderer from "../../debug/render/renderer.js"

import {expect} from "chai"

describe("render/renderer", () => {
    describe("types", () => {
        it("exists", () => {
            expect(renderer.types).to.be.an("object")
        })

        it("contains correct values", () => {
            expect(renderer.types).to.eql({
                html: 0,
                htmlVoid: 1,
                xml: 2,
                xmlEnd: 3,
                trust: 4,
                root: 5,
            })
        })
    })

    describe("n()", () => {
        it("exists", () => {
            expect(renderer.n).to.be.a("function")
        })

        it("returns the correct value", () => {
            expect(renderer.n(0, "name", [], [])).to.eql({
                type: 0,
                name: "name",
                attrs: [],
                children: [],
            })
        })

        it("coerces the `type` to a 32-bit integer", () => {
            expect(renderer.n(1.25, "name", [], [])).to.eql({
                type: 1,
                name: "name",
                attrs: [],
                children: [],
            })

            // 9 `f` hex digits
            expect(renderer.n(0xfffffffff, "name", [], [])).to.eql({
                type: -1,
                name: "name",
                attrs: [],
                children: [],
            })
        })
    })

    describe("trust()", () => {
        it("exists", () => {
            expect(renderer.trust).to.be.a("function")
        })

        it("returns the correct value", () => {
            expect(renderer.trust("string")).to.eql({
                type: renderer.types.trust,
                value: "string",
            })
        })
    })

    describe("root()", () => {
        it("exists", () => {
            expect(renderer.root).to.be.a("function")
        })

        it("returns the correct value", () => {
            expect(renderer.root([])).to.eql({
                type: renderer.types.root,
                children: [],
            })
        })
    })

    describe("render()", () => { // eslint-disable-line max-statements
        const {render, n, trust, root, types} = renderer

        it("exists", () => {
            expect(render).to.be.a("function")
        })

        it("correctly renders empty strings", () => {
            expect(render("")).to.equal("")
        })

        it("correctly escapes untrusted strings", () => {
            expect(render("<foo>'\"&lt;\"'</foo>"))
                .to.equal("&lt;foo>'\"&amp;lt;\"'&lt;/foo>")
        })

        it("correctly renders trusted strings", () => {
            expect(render(trust("<foo>'\"&lt;\"'</foo>")))
                .to.equal("<foo>'\"&lt;\"'</foo>")
        })

        it("correctly renders root nodes", () => {
            expect(render(root([
                "foo ",
                "bar ",
                "baz",
            ]))).to.equal("foo bar baz")
        })

        it("correctly renders root nodes with untrusted strings", () => {
            expect(render(root([
                "foo ",
                "bar ",
                "<foo>'\"&lt;\"'</foo>",
            ]))).to.equal("foo bar &lt;foo>'\"&amp;lt;\"'&lt;/foo>")
        })

        it("correctly renders root nodes with trusted strings", () => {
            expect(render(root([
                "foo ",
                "bar ",
                trust("<foo>'\"&lt;\"'</foo>"),
            ]))).to.equal("foo bar <foo>'\"&lt;\"'</foo>")
        })

        it("throws on recursive trees", () => {
            let children = []
            let node = n(0, "foo", [], children)
            children.push(node)

            function run() {
                return render(node)
            }

            expect(run).to.throw(TypeError)

            node = root(children = [])
            children.push(node)

            expect(run).to.throw(TypeError)

            node = n(0, "foo", [], children)
            children.push(n(0, "bar", [], children))

            expect(run).to.throw(TypeError)
        })

        it("correctly renders void HTML nodes", () => {
            expect(render(n(
                types.htmlVoid,
                "foo",
                [],
                []
            ))).to.equal("<foo>")
        })

        it("correctly renders void HTML nodes with attrs", () => {
            expect(render(n(
                types.htmlVoid,
                "foo",
                [["a", "b"], ["c", "d"]],
                []
            ))).to.equal('<foo a="b" c="d">')
        })

        it("correctly escapes void HTML attributes", () => {
            expect(render(n(
                types.htmlVoid,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                []
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">'
            )
        })

        it("correctly renders non-void empty HTML nodes", () => {
            expect(render(n(
                types.html,
                "foo",
                [],
                []
            ))).to.equal("<foo></foo>")
        })

        it("correctly renders non-void empty HTML nodes with attrs", () => {
            expect(render(n(
                types.html,
                "foo",
                [["a", "b"], ["c", "d"]],
                []
            ))).to.equal('<foo a="b" c="d"></foo>')
        })

        it("correctly escapes non-void empty HTML attributes", () => {
            expect(render(n(
                types.html,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                []
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "</foo>"
            )
        })

        it("correctly renders non-void HTML nodes", () => {
            expect(render(n(
                types.html,
                "foo",
                [],
                ["a", "b"]
            ))).to.equal("<foo>ab</foo>")
        })

        it("correctly renders non-void HTML nodes with attrs", () => {
            expect(render(n(
                types.html,
                "foo",
                [["a", "b"], ["c", "d"]],
                ["a", "b"]
            ))).to.equal('<foo a="b" c="d">ab</foo>')
        })

        it("correctly escapes non-void HTML attrs", () => {
            expect(render(n(
                types.html,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                ["a", "b"]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "ab</foo>"
            )
        })

        it("correctly escapes non-void HTML body and attrs", () => {
            expect(render(n(
                types.html,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                [
                    "foo ",
                    "bar ",
                    "<foo>'\"&lt;\"'</foo>",
                ]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "foo bar &lt;foo>'\"&amp;lt;\"'&lt;/foo></foo>"
            )
        })

        it("correctly renders non-void HTML trusted body and attrs", () => {
            expect(render(n(
                types.html,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                [
                    "foo ",
                    "bar ",
                    trust("<foo>'\"&lt;\"'</foo>"),
                ]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "foo bar <foo>'\"&lt;\"'</foo></foo>"
            )
        })

        it("correctly renders empty XML nodes", () => {
            expect(render(n(
                types.xml,
                "foo",
                [],
                []
            ))).to.equal("<foo/>")
        })

        it("correctly renders empty XML nodes with attrs", () => {
            expect(render(n(
                types.xml,
                "foo",
                [["a", "b"], ["c", "d"]],
                []
            ))).to.equal('<foo a="b" c="d"/>')
        })

        it("correctly escapes empty XML attributes", () => {
            expect(render(n(
                types.xml,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                []
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d"/>'
            )
        })

        it("correctly renders empty XML force-end nodes", () => {
            expect(render(n(
                types.xmlEnd,
                "foo",
                [],
                []
            ))).to.equal("<foo></foo>")
        })

        it("correctly renders empty XML force-end nodes with attrs", () => {
            expect(render(n(
                types.xmlEnd,
                "foo",
                [["a", "b"], ["c", "d"]],
                []
            ))).to.equal('<foo a="b" c="d"></foo>')
        })

        it("correctly escapes empty XML force-end attributes", () => {
            expect(render(n(
                types.xmlEnd,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                []
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "</foo>"
            )
        })

        it("correctly renders non-empty XML nodes", () => {
            expect(render(n(
                types.xml,
                "foo",
                [],
                ["a", "b"]
            ))).to.equal("<foo>ab</foo>")
        })

        it("correctly renders non-empty XML nodes with attrs", () => {
            expect(render(n(
                types.xml,
                "foo",
                [["a", "b"], ["c", "d"]],
                ["a", "b"]
            ))).to.equal('<foo a="b" c="d">ab</foo>')
        })

        it("correctly escapes non-empty XML attrs", () => {
            expect(render(n(
                types.xml,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                ["a", "b"]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "ab</foo>"
            )
        })

        it("correctly escapes non-empty XML body and attrs", () => {
            expect(render(n(
                types.xml,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                [
                    "foo ",
                    "bar ",
                    "<foo>'\"&lt;\"'</foo>",
                ]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "foo bar &lt;foo>'\"&amp;lt;\"'&lt;/foo></foo>"
            )
        })

        it("correctly renders non-empty XML trusted body and attrs", () => {
            expect(render(n(
                types.xml,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                [
                    "foo ",
                    "bar ",
                    trust("<foo>'\"&lt;\"'</foo>"),
                ]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "foo bar <foo>'\"&lt;\"'</foo></foo>"
            )
        })

        it("correctly renders non-empty XML force-end nodes", () => {
            expect(render(n(
                types.xmlEnd,
                "foo",
                [],
                ["a", "b"]
            ))).to.equal("<foo>ab</foo>")
        })

        it("correctly renders non-empty XML force-end nodes with attrs", () => {
            expect(render(n(
                types.xmlEnd,
                "foo",
                [["a", "b"], ["c", "d"]],
                ["a", "b"]
            ))).to.equal('<foo a="b" c="d">ab</foo>')
        })

        it("correctly escapes non-empty XML force-end attrs", () => {
            expect(render(n(
                types.xmlEnd,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                ["a", "b"]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "ab</foo>"
            )
        })

        it("correctly escapes non-empty XML force-end body and attrs", () => {
            expect(render(n(
                types.xmlEnd,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                [
                    "foo ",
                    "bar ",
                    "<foo>'\"&lt;\"'</foo>",
                ]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "foo bar &lt;foo>'\"&amp;lt;\"'&lt;/foo></foo>"
            )
        })

        it("correctly renders non-empty XML force-end trusted body and attrs", () => { // eslint-disable-line max-len
            expect(render(n(
                types.xmlEnd,
                "foo",
                [["a", "<foo>'\"&lt;\"'</foo>"], ["c", "d"]],
                [
                    "foo ",
                    "bar ",
                    trust("<foo>'\"&lt;\"'</foo>"),
                ]
            ))).to.equal(
                '<foo a="&lt;foo>\'&quot;&amp;lt;&quot;\'&lt;/foo>" c="d">' +
                "foo bar <foo>'\"&lt;\"'</foo></foo>"
            )
        })

        it("correctly renders a root with multiple non-void empty children", () => { // eslint-disable-line max-len
            expect(render(root([
                n(types.xmlEnd, "div", [], []),
                n(types.xmlEnd, "a", [], []),
                n(types.xmlEnd, "em", [], ["word"]),
            ]))).to.equal("<div></div><a></a><em>word</em>")
        })
    })
})
