import m, * as mithril from "../../debug/constructor.js"
const {trust} = mithril
import {render} from "../../debug/render/index.js"

import * as sinon from "sinon"
import chai, {expect} from "chai"
import sinonChai from "sinon-chai"
chai.use(sinonChai)

describe("m.render()", () => { // eslint-disable-line max-statements
    it("exists", () => {
        expect(render).to.be.a("function")
    })

    // Make void tags explicit for the sake of testing
    function makeTest(type) {
        return function (opts, tree, expected) {
            if (arguments.length === 2) {
                expected = tree
                tree = opts
                opts = {}
            } else if (arguments.length !== 3) {
                throw new Error("This requires 2 or 3 arguments")
            }

            let voids = opts.voids || []
            if (voids === true) voids = undefined

            const res = render(
                tree,
                opts.type || type,
                voids
            )

            if (expected instanceof RegExp) {
                expect(res).to.match(expected)
            } else {
                expect(res).to.equal(expected)
            }
        }
    }

    context("type: *", () => { // eslint-disable-line max-statements
        const test = makeTest()

        it("renders nothing", () => {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", () => {
            test("foo", "foo")
        })

        it("escapes strings", () => {
            test(`<foo a="1" b='2'>&lt;`, `&lt;foo a="1" b='2'>&amp;lt;`)
        })

        it("doesn't escape trusted strings", () => {
            test(trust(`<foo a="1" b='2'>&lt;`), `<foo a="1" b='2'>&lt;`)
        })

        it("renders xml declarations with default encoding utf-8 and version 1.1", () => { // eslint-disable-line
            test(m("?xml"), `<?xml version="1.1" encoding="utf-8"?>`)
        })

        it("renders xml declarations with explicit version 1.0", () => {
            test(m("?xml", {
                version: "1.0",
            }), `<?xml version="1.0" encoding="utf-8"?>`)
        })

        it("renders xml declarations with explicit version 1.1", () => {
            test(m("?xml", {
                version: "1.1",
            }), `<?xml version="1.1" encoding="utf-8"?>`)
        })

        it("renders xml declarations with encoding", () => {
            test(m("?xml", {
                encoding: "invalid",
            }), `<?xml version="1.1" encoding="invalid"?>`)
        })

        it("renders xml declarations with standalone: \"yes\"", () => {
            test(m("?xml", {
                standalone: "yes",
            }), `<?xml version="1.1" encoding="utf-8" standalone="yes"?>`)
        })

        it("renders xml declarations with standalone: \"no\"", () => {
            test(m("?xml", {
                standalone: "no",
            }), `<?xml version="1.1" encoding="utf-8" standalone="no"?>`)
        })

        it("renders xml declarations with standalone: true", () => {
            test(m("?xml", {
                standalone: true,
            }), `<?xml version="1.1" encoding="utf-8" standalone="yes"?>`)
        })

        it("renders xml declarations with standalone: true", () => {
            test(m("?xml", {
                standalone: false,
            }), `<?xml version="1.1" encoding="utf-8" standalone="no"?>`)
        })

        it("renders html5 doctype", () => {
            test(m("!doctype", "html"), "<!DOCTYPE html>")
        })

        it("renders html4 strict doctype", () => {
            test(m("!doctype", "html4-strict"),
                `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" ` +
                `"http://www.w3.org/TR/html4/strict.dtd">`)
        })

        it("renders html4 transitional doctype", () => {
            test(m("!doctype", "html4-transitional"),
                "<!DOCTYPE HTML PUBLIC " +
                `"-//W3C//DTD HTML 4.01 Transitional//EN" ` +
                `"http://www.w3.org/TR/html4/loose.dtd">`)
        })

        it("renders html4 frameset doctype", () => {
            test(m("!doctype", "html4-frameset"),
                "<!DOCTYPE HTML PUBLIC " +
                `"-//W3C//DTD HTML 4.01 Frameset//EN" ` +
                '"http://www.w3.org/TR/html4/frameset.dtd">')
        })

        it("triggers XML behavior with XML declaration", () => {
            test([
                m("?xml"),
                m("img"),
            ], `<?xml version="1.1" encoding="utf-8"?><img/>`)
        })

        it("renders HTML by default", () => {
            test({voids: true}, m("img"), "<img>")
        })

        it("renders empty components correctly", () => {
            const component = {}
            test(m(component), "")
        })

        it("renders components with just a view correctly", () => {
            const component = {view: () => "string"}
            test(m(component), "string")
        })

        it("renders components with just a controller correctly", () => {
            test(m({controller() {}}), "")
        })

        it("renders components with a controller and view correctly", () => {
            test(m({
                controller() {
                    this.value = 1
                },

                view(ctrl) {
                    return ctrl.value
                },
            }), "1")
        })

        it("renders components that generate nodes correctly", () => {
            test(m({view: () => m("div", "foo")}), "<div>foo</div>")
        })

        it("renders components that return other components correctly", () => {
            const sub = {view: () => m("div", "foo")}
            test(m({view: () => m(sub)}), "<div>foo</div>")
        })

        it("renders components that directly return other components correctly", () => { // eslint-disable-line max-len
            const sub = {view: () => m("div", "foo")}
            test(m({view: () => sub}), "<div>foo</div>")
        })

        it("renders components that return other nested components correctly", () => { // eslint-disable-line max-len
            const sub3 = {view: () => m("div", "foo")}
            const sub2 = {view: () => sub3}
            const sub1 = {view: () => sub2}
            const sub = {view: () => sub1}

            test(m({view: () => m(sub)}), "<div>foo</div>")
        })

        it("renders components that directly return other nested components correctly", () => { // eslint-disable-line max-len
            const sub3 = {view: () => m("div", "foo")}
            const sub2 = {view: () => m(sub3)}
            const sub1 = {view: () => m(sub2)}
            const sub = {view: () => m(sub1)}

            test(m({view: () => sub}), "<div>foo</div>")
        })

        it("renders components that directly return other nested mixed components correctly", () => { // eslint-disable-line max-len
            const sub3 = {view: () => m("div", "foo")}
            const sub2 = {view: () => m(sub3)}
            const sub1 = {view: () => sub2}
            const sub = {view: () => sub1}

            test(m({view: () => m(sub)}), "<div>foo</div>")
        })

        it("calls views once", () => {
            /* eslint-disable no-use-before-define */
            const spy3 = sinon.spy(() => m("div", "foo"))
            const spy2 = sinon.spy(() => m(sub3))
            const spy1 = sinon.spy(() => sub2)
            const spy0 = sinon.spy(() => sub1)
            /* eslint-enable no-use-before-define */

            const sub3 = {view: spy3}
            const sub2 = {view: spy2}
            const sub1 = {view: spy1}
            const sub0 = {view: spy0}

            test(m(sub0), "<div>foo</div>")
            expect(spy3).to.have.been.calledOnce
            expect(spy2).to.have.been.calledOnce
            expect(spy1).to.have.been.calledOnce
            expect(spy0).to.have.been.calledOnce
        })

        it("calls controllers once", () => {
            /* eslint-disable no-use-before-define */
            const spy3 = sinon.spy()
            const spy2 = sinon.spy()
            const spy1 = sinon.spy()
            const spy0 = sinon.spy()
            /* eslint-enable no-use-before-define */

            const sub3 = {
                controller: spy3,
                view: () => m("div", "foo"),
            }

            const sub2 = {
                controller: spy2,
                view: () => m(sub3),
            }

            const sub1 = {
                controller: spy1,
                view: () => sub2,
            }

            const sub0 = {
                controller: spy0,
                view: () => sub1,
            }

            test(m(sub0), "<div>foo</div>")
            expect(spy3).to.have.been.calledOnce
            expect(spy2).to.have.been.calledOnce
            expect(spy1).to.have.been.calledOnce
            expect(spy0).to.have.been.calledOnce
        })

        it("considers anything with a `view` property to be a component", () => { // eslint-disable-line max-len
            test({view: () => "string"}, "string")
        })

        it("throws when given a component with a non-callable `view`", () => {
            expect(() => render({view: 2})).to.throw()
            expect(() => render(m({view: 2}))).to.throw()
        })

        it("throws when given a component that returns one with a non-callable view", () => { // eslint-disable-line max-len
            expect(() => render({view: () => ({view: 1})})).to.throw()
            expect(() => render(m({view: () => m({view: 1})}))).to.throw()
            expect(() => render(m({view: () => ({view: 1})}))).to.throw()
        })

        it("renders string event handlers to strings", () => {
            test({voids: true}, [
                m("!doctype", "html"),
                m("div#foo", {onclick: "doSomething()"}),
            ], '<!DOCTYPE html><div id="foo" onclick="doSomething()"></div>')
        })
    })

    context("type: html", () => { // eslint-disable-line
        const test = makeTest("html")

        it("renders nothing", () => {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", () => {
            test("foo", "foo")
        })

        it("escapes strings", () => {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", () => {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", () => {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", () => {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", () => {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", () => {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", () => {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a><b>")
        })

        it("renders classes", () => {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", () => {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", () => {
            test([
                m("div", "foo"),
            ], "<div>foo</div>")
        })

        it("renders child nodes", () => {
            test([
                m("div", m("a", "foo")),
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo"),
            ], "<div><a>foo</div>")
        })

        it("ignores children on void nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a", "foo")),
            ], "<div><a></div>")
        })

        it("escapes children's strings", () => {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", () => {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", () => {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", () => {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar"),
                ]),
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", () => {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", () => {
            const list = [
                "area", "base", "br", "col", "embed", "hr", "img", "input",
                "keygen", "link", "menuitem", "meta", "param", "source",
                "track", "wbr",
            ]
            test({voids: true},
                list.map(tag => m(`${tag}#id`, "value")),
                list.map(tag => `<${tag} id="id">`).join(""))
        })

        it("renders complex pages without components", () => {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]"),
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", trust("$('#body').append(getChild())")),
                ]),
            ], [
                "<!DOCTYPE html>",
                "<head>",
                '<script src="//code.jquery.com/jquery-2.1.4.min.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap.css">',
                '<script src="/static/bootstrap.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap-theme.css">',
                '<script src="/static/index.js"></script>',
                "</head><body>",
                '<img src="/static/image.png">',
                '<div id="body"></div>',
                "<script>$('#body').append(getChild())</script>",
                "</body>",
            ].join(""))
        })

        it("renders nested SVG elements correctly", () => {
            test({voids: true}, m("div", [
                m("svg[xmlns=http://www.w3.org/2000/svg]", {
                    width: "100%",
                    height: "100%",
                    viewBox: "0 0 400 400",
                    "xmlns:xlink": "http://www.w3.org/1999/xlink",
                }, [
                    m("path", {
                        d: "M 100 100 L 300 100 L 200 300 z",
                        fill: "orange",
                        stroke: "black",
                        "stroke-width": 3,
                    }),

                    m("a[xlink:href=http://svgwg.org][target=_blank]", [
                        m("rect[height=30][width=120][y=0][x=0][rx=15]"),
                        m("text[fill=white][text-anchor=middle][y=21][x=60]",
                            "SVG WG website"),
                    ]),
                ]),
                m("img[src=/image.png]"),
            ]), [
                '<div><svg xmlns="http://www.w3.org/2000/svg" width="100%" ',
                'height="100%" viewBox="0 0 400 400" ',
                'xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<path d="M 100 100 L 300 100 L 200 300 z" fill="orange" ',
                'stroke="black" stroke-width="3"/>',
                '<a xlink:href="http://svgwg.org" target="_blank">',
                '<rect height="30" width="120" y="0" x="0" rx="15"/>',
                '<text fill="white" text-anchor="middle" y="21" x="60">',
                'SVG WG website</text></a></svg><img src="/image.png"></div>',
            ].join(""))
        })

        it("renders nested MathML elements correctly", () => {
            test({voids: true}, m("div", [
                m("math[display=block]", m("mrow", [
                    m("mi", "f"),
                    m("mo[stretchy=false]", "("),
                    m("mi", "x"),
                    m("mo[stretchy=false]", ")"),
                    m("mo", "="),
                    m("mrow", m("mo", "{"), m("mtable", [
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mn", "1"),
                                m("mo", "/"),
                                m("mn", "3"),
                            ])),
                            m("mtd[columnalign=left]", m("mrow", [
                                m("mtext", trust("if&nbsp;")),
                                m("mn", "0"),
                                m("mo", trust("&leq;")),
                                m("mi", "x"),
                                m("mo", trust("&leq;")),
                                m("mn", "1"),
                                m("mo", ";"),
                            ])),
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mn", "2"),
                                m("mo", "/"),
                                m("mn", "3"),
                            ])),
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mtext", trust("if&nbsp;")),
                                m("mn", "3"),
                                m("mo", trust("&leq;")),
                                m("mi", "x"),
                                m("mo", trust("&leq;")),
                                m("mn", "4"),
                                m("mo", ";"),
                            ])),
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mn", "0")),
                            m("mtd[columnalign=left]",
                                m("mtext", "elsewhere.")),
                        ]),
                    ])),
                ])),
                m("img[src=/image.png]"),
            ]), [
                '<div><math display="block"><mrow><mi>f</mi>',
                '<mo stretchy="false">(</mo><mi>x</mi>',
                '<mo stretchy="false">)</mo><mo>=</mo><mrow><mo>{</mo><mtable>',
                '<mtr><mtd columnalign="center"><mrow><mn>1</mn><mo>/</mo>',
                '<mn>3</mn></mrow></mtd><mtd columnalign="left"><mrow>',
                "<mtext>if&nbsp;</mtext><mn>0</mn><mo>&leq;</mo><mi>x</mi>",
                "<mo>&leq;</mo><mn>1</mn><mo>;</mo></mrow></mtd></mtr><mtr>",
                '<mtd columnalign="center"><mrow><mn>2</mn><mo>/</mo>',
                '<mn>3</mn></mrow></mtd><mtd columnalign="center"><mrow>',
                "<mtext>if&nbsp;</mtext><mn>3</mn><mo>&leq;</mo><mi>x</mi>",
                "<mo>&leq;</mo><mn>4</mn><mo>;</mo></mrow></mtd></mtr><mtr>",
                '<mtd columnalign="center"><mn>0</mn></mtd>',
                '<mtd columnalign="left"><mtext>elsewhere.</mtext></mtd></mtr>',
                '</mtable></mrow></mrow></math><img src="/image.png"></div>',
            ].join(""))
        })
    })

    context("type: html-polyglot", () => { // eslint-disable-line
        const test = makeTest("html-polyglot")

        it("renders nothing", () => {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", () => {
            test("foo", "foo")
        })

        it("escapes strings", () => {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", () => {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", () => {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", () => {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", () => {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", () => {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", () => {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a/><b/>")
        })

        it("renders classes", () => {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", () => {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", () => {
            test([
                m("div", "foo"),
            ], "<div>foo</div>")
        })

        it("renders child nodes", () => {
            test([
                m("div", m("a", "foo")),
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo"),
            ], "<div><a/>foo</div>")
        })

        it("ignores children on void nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a", "foo")),
            ], "<div><a/></div>")
        })

        it("escapes children's strings", () => {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", () => {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", () => {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", () => {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar"),
                ]),
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", () => {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", () => {
            const list = [
                "area", "base", "br", "col", "embed", "hr", "img", "input",
                "keygen", "link", "menuitem", "meta", "param", "source",
                "track", "wbr",
            ]
            test({voids: true},
                list.map(tag => m(`${tag}#id`, "value")),
                list.map(tag => `<${tag} id="id"/>`).join(""))
        })

        it("renders complex pages without components", () => {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]"),
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", trust("$('#body').append(getChild())")),
                ]),
            ], [
                "<!DOCTYPE html>",
                "<head>",
                '<script src="//code.jquery.com/jquery-2.1.4.min.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap.css"/>',
                '<script src="/static/bootstrap.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap-theme.css"/>',
                '<script src="/static/index.js"></script>',
                "</head><body>",
                '<img src="/static/image.png"/>',
                '<div id="body"></div>',
                "<script>$('#body').append(getChild())</script>",
                "</body>",
            ].join(""))
        })

        it("renders nested SVG elements correctly", () => {
            test({voids: true}, m("div", [
                m("svg[xmlns=http://www.w3.org/2000/svg]", {
                    width: "100%",
                    height: "100%",
                    viewBox: "0 0 400 400",
                    "xmlns:xlink": "http://www.w3.org/1999/xlink",
                }, [
                    m("path", {
                        d: "M 100 100 L 300 100 L 200 300 z",
                        fill: "orange",
                        stroke: "black",
                        "stroke-width": 3,
                    }),
                    m("a[xlink:href=http://svgwg.org][target=_blank]", [
                        m("rect[height=30][width=120][y=0][x=0][rx=15]"),
                        m("text[fill=white][text-anchor=middle][y=21][x=60]",
                            "SVG WG website"),
                    ]),
                ]),
                m("img[src=/image.png]"),
            ]), [
                '<div><svg xmlns="http://www.w3.org/2000/svg" width="100%" ',
                'height="100%" viewBox="0 0 400 400" ',
                'xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<path d="M 100 100 L 300 100 L 200 300 z" fill="orange" ',
                'stroke="black" stroke-width="3"/>',
                '<a xlink:href="http://svgwg.org" target="_blank">',
                '<rect height="30" width="120" y="0" x="0" rx="15"/>',
                '<text fill="white" text-anchor="middle" y="21" x="60">',
                'SVG WG website</text></a></svg><img src="/image.png"/></div>',
            ].join(""))
        })

        it("renders nested MathML elements correctly", () => {
            test({voids: true}, m("div", [
                m("math[display=block]", m("mrow", [
                    m("mi", "f"),
                    m("mo[stretchy=false]", "("),
                    m("mi", "x"),
                    m("mo[stretchy=false]", ")"),
                    m("mo", "="),
                    m("mrow", m("mo", "{"), m("mtable", [
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mn", "1"),
                                m("mo", "/"),
                                m("mn", "3"),
                            ])),
                            m("mtd[columnalign=left]", m("mrow", [
                                m("mtext", trust("if&nbsp;")),
                                m("mn", "0"),
                                m("mo", trust("&leq;")),
                                m("mi", "x"),
                                m("mo", trust("&leq;")),
                                m("mn", "1"),
                                m("mo", ";"),
                            ])),
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mn", "2"),
                                m("mo", "/"),
                                m("mn", "3"),
                            ])),
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mtext", trust("if&nbsp;")),
                                m("mn", "3"),
                                m("mo", trust("&leq;")),
                                m("mi", "x"),
                                m("mo", trust("&leq;")),
                                m("mn", "4"),
                                m("mo", ";"),
                            ])),
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mn", "0")),
                            m("mtd[columnalign=left]",
                                m("mtext", "elsewhere.")),
                        ]),
                    ])),
                ])),
                m("img[src=/image.png]"),
            ]), [
                '<div><math display="block"><mrow><mi>f</mi>',
                '<mo stretchy="false">(</mo><mi>x</mi>',
                '<mo stretchy="false">)</mo><mo>=</mo><mrow><mo>{</mo><mtable>',
                '<mtr><mtd columnalign="center"><mrow><mn>1</mn><mo>/</mo>',
                '<mn>3</mn></mrow></mtd><mtd columnalign="left"><mrow>',
                "<mtext>if&nbsp;</mtext><mn>0</mn><mo>&leq;</mo><mi>x</mi>",
                "<mo>&leq;</mo><mn>1</mn><mo>;</mo></mrow></mtd></mtr><mtr>",
                '<mtd columnalign="center"><mrow><mn>2</mn><mo>/</mo>',
                '<mn>3</mn></mrow></mtd><mtd columnalign="center"><mrow>',
                "<mtext>if&nbsp;</mtext><mn>3</mn><mo>&leq;</mo><mi>x</mi>",
                "<mo>&leq;</mo><mn>4</mn><mo>;</mo></mrow></mtd></mtr><mtr>",
                '<mtd columnalign="center"><mn>0</mn></mtd>',
                '<mtd columnalign="left"><mtext>elsewhere.</mtext></mtd></mtr>',
                '</mtable></mrow></mrow></math><img src="/image.png"/></div>',
            ].join(""))
        })
    })

    context("type: html4", () => { // eslint-disable-line max-statements
        const test = makeTest("html4")

        it("renders nothing", () => {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", () => {
            test("foo", "foo")
        })

        it("escapes strings", () => {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", () => {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", () => {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", () => {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", () => {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", () => {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", () => {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a><b>")
        })

        it("renders classes", () => {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", () => {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", () => {
            test([
                m("div", "foo"),
            ], "<div>foo</div>")
        })

        it("renders child nodes", () => {
            test([
                m("div", m("a", "foo")),
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo"),
            ], "<div><a>foo</div>")
        })

        it("ignores children on void nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a", "foo")),
            ], "<div><a></div>")
        })

        it("escapes children's strings", () => {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", () => {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", () => {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", () => {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar"),
                ]),
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", () => {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", () => {
            const list = [
                "area", "base", "basefont", "br", "col", "frame", "hr", "img",
                "input", "isindex", "link", "meta", "param",
            ]
            test({voids: true},
                list.map(tag => m(`${tag}#id`, "value")),
                list.map(tag => `<${tag} id="id">`).join(""))
        })

        it("renders complex pages without components", () => {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]"),
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", trust("$('#body').append(getChild())")),
                ]),
            ], [
                "<!DOCTYPE html>",
                "<head>",
                '<script src="//code.jquery.com/jquery-2.1.4.min.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap.css">',
                '<script src="/static/bootstrap.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap-theme.css">',
                '<script src="/static/index.js"></script>',
                "</head><body>",
                '<img src="/static/image.png">',
                '<div id="body"></div>',
                "<script>$('#body').append(getChild())</script>",
                "</body>",
            ].join(""))
        })
    })

    context("type: xhtml", () => { // eslint-disable-line
        const test = makeTest("xhtml")

        it("renders nothing", () => {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", () => {
            test("foo", "foo")
        })

        it("escapes strings", () => {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", () => {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", () => {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", () => {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", () => {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", () => {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", () => {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a/><b/>")
        })

        it("renders classes", () => {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", () => {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", () => {
            test([
                m("div", "foo"),
            ], "<div>foo</div>")
        })

        it("renders child nodes", () => {
            test([
                m("div", m("a", "foo")),
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo"),
            ], "<div><a/>foo</div>")
        })

        it("ignores children on void nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a", "foo")),
            ], "<div><a/></div>")
        })

        it("escapes children's strings", () => {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", () => {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", () => {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", () => {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar"),
                ]),
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", () => {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", () => {
            const list = [
                "area", "base", "basefont", "br", "col", "frame", "hr", "img",
                "input", "isindex", "link", "meta", "param",
            ]
            test({voids: true},
                list.map(tag => m(`${tag}#id`, "value")),
                list.map(tag => `<${tag} id="id"/>`).join(""))
        })

        it("renders complex pages without components", () => {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]"),
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", trust("$('#body').append(getChild())")),
                ]),
            ], [
                "<!DOCTYPE html>",
                "<head>",
                '<script src="//code.jquery.com/jquery-2.1.4.min.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap.css"/>',
                '<script src="/static/bootstrap.js"></script>',
                '<link rel="stylesheet" href="/static/bootstrap-theme.css"/>',
                '<script src="/static/index.js"></script>',
                "</head><body>",
                '<img src="/static/image.png"/>',
                '<div id="body"></div>',
                "<script>$('#body').append(getChild())</script>",
                "</body>",
            ].join(""))
        })
    })

    context("type: xml", () => { // eslint-disable-line
        const test = makeTest("xml")

        it("renders nothing", () => {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", () => {
            test("foo", "foo")
        })

        it("escapes strings", () => {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", () => {
            test(m("div"), "<div/>")
        })

        it("renders a single empty div in an array", () => {
            test([m("div")], "<div/>")
        })

        it("renders a single empty span in an array", () => {
            test([m("span")], "<span/>")
        })

        it("renders multiple empty elements in an array", () => {
            test([m("div"), m("span")], "<div/><span/>")
        })

        it("renders highly nested arrays of mixed elements", () => {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div/><a/><em>word</em>")
        })

        it("renders classes on className", () => {
            test([m("div.foo")], "<div className=\"foo\"/>")
        })

        it("renders ids", () => {
            test([m("div#foo")], "<div id=\"foo\"/>")
        })

        it("renders child strings", () => {
            test([
                m("div", "foo"),
            ], "<div>foo</div>")
        })

        it("renders child nodes", () => {
            test([
                m("div", m("a", "foo")),
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo"),
            ], "<div><a/>foo</div>")
        })

        it("ignores void nodes", () => {
            test({voids: ["a"]}, [
                m("div", m("a", "foo")),
            ], "<div><a>foo</a></div>")
        })

        it("escapes children's strings", () => {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", () => {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"/>")
        })

        it("renders children's attributes", () => {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"/></div>")
        })

        it("renders multiple children", () => {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar"),
                ]),
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", () => {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders complex documents without components", () => {
            test({voids: true}, [
                m("?xml"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]"),
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", m("!CDATA", "$('#body').append(getChild())")),
                ]),
            ], [
                `<?xml version="1.1" encoding="utf-8"?>`,
                "<head>",
                '<script src="//code.jquery.com/jquery-2.1.4.min.js"/>',
                '<link rel="stylesheet" href="/static/bootstrap.css"/>',
                '<script src="/static/bootstrap.js"/>',
                '<link rel="stylesheet" href="/static/bootstrap-theme.css"/>',
                '<script src="/static/index.js"/>',
                "</head><body>",
                '<img src="/static/image.png"/>',
                '<div id="body"/>',
                "<script><![CDATA[$('#body').append(getChild())]]></script>",
                "</body>",
            ].join(""))
        })

        it("renders attributes with hyphens and namespaces correctly", () => {
            test({voids: true}, m("div", [
                m("svg[xmlns=http://www.w3.org/2000/svg]", {
                    width: "100%",
                    height: "100%",
                    viewBox: "0 0 400 400",
                    "xmlns:xlink": "http://www.w3.org/1999/xlink",
                }, [
                    m("path", {
                        d: "M 100 100 L 300 100 L 200 300 z",
                        fill: "orange",
                        stroke: "black",
                        "stroke-width": 3,
                    }),
                    m("a[xlink:href=http://svgwg.org][target=_blank]", [
                        m("rect[height=30][width=120][y=0][x=0][rx=15]"),
                        m("text[fill=white][text-anchor=middle][y=21][x=60]",
                            "SVG WG website"),
                    ]),
                ]),
                m("img[src=/image.png]"),
            ]), [
                '<div><svg xmlns="http://www.w3.org/2000/svg" width="100%" ',
                'height="100%" viewBox="0 0 400 400" ',
                'xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<path d="M 100 100 L 300 100 L 200 300 z" fill="orange" ',
                'stroke="black" stroke-width="3"/>',
                '<a xlink:href="http://svgwg.org" target="_blank">',
                '<rect height="30" width="120" y="0" x="0" rx="15"/>',
                '<text fill="white" text-anchor="middle" y="21" x="60">',
                'SVG WG website</text></a></svg><img src="/image.png"/></div>',
            ].join(""))
        })

        it("renders namespaced elements correctly", () => {
            test({voids: true}, m("xsl:stylesheet[version=1.0]", {
                "xmlns:xsl": "http://www.w3.org/1999/XSL/Transform",
            }, [
                m("xsl:template[match=/hello-world]", m("html", [
                    m("head", m("title")),
                    m("body", [
                        m("h1", m("xsl:value-of[select=greeting]")),
                        m("xsl:apply-templates[select=greeter]"),
                    ]),
                ])),
                m("xsl:template[match=greeter]", [
                    m("div", [
                        "from ", m("i", m("xsl:value-of[select='.']")),
                    ]),
                ]),
            ]), [
                '<xsl:stylesheet version="1.0" ',
                'xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
                '<xsl:template match="/hello-world"><html><head><title/>',
                '</head><body><h1><xsl:value-of select="greeting"/></h1>',
                '<xsl:apply-templates select="greeter"/></body></html>',
                '</xsl:template><xsl:template match="greeter"><div>from ',
                '<i><xsl:value-of select="."/></i></div></xsl:template>',
                "</xsl:stylesheet>",
            ].join(""))
        })

        it("renders names with punctuation in them correctly", () => {
            test({voids: true}, [
                mithril.r("android.support.design.widget.CoordinatorLayout", {
                    "xmlns:android": "http://schemas.android.com/apk/res/android", // eslint-disable-line
                    "xmlns:app": "http://schemas.android.com/apk/res-auto",
                    "android:layout_width": "match_parent",
                    "android:layout_height": "match_parent",
                }, [
                    mithril.r("android.support.v7.widget.RecyclerView", {
                        "android:layout_width": "match_parent",
                        "android:layout_height": "match_parent",
                        "app:layout_behavior": "@string/appbar_view_behavior",
                    }),
                    mithril.r("android.support.design.widget.AppBarLayout", {
                        "android:layout_width": "match_parent",
                        "android:layout_height": "wrap_content",
                    }, [
                        mithril.r("android.support.v7.widget.Toolbar", {
                            "app:layout_scrollFlags": "scroll|enterAlways",
                        }),
                        mithril.r("android.support.design.widget.TabLayout", {
                            "app:layout_scrollFlags": "scroll|enterAlways",
                        }),
                    ]),
                ]),
            ], [
                "<android.support.design.widget.CoordinatorLayout ",
                'xmlns:android="http://schemas.android.com/apk/res/android" ',
                'xmlns:app="http://schemas.android.com/apk/res-auto" ',
                'android:layout_width="match_parent" ',
                'android:layout_height="match_parent">',
                "<android.support.v7.widget.RecyclerView ",
                'android:layout_width="match_parent" ',
                'android:layout_height="match_parent" ',
                'app:layout_behavior="@string/appbar_view_behavior"/>',
                "<android.support.design.widget.AppBarLayout ",
                'android:layout_width="match_parent" ',
                'android:layout_height="wrap_content">',
                "<android.support.v7.widget.Toolbar ",
                'app:layout_scrollFlags="scroll|enterAlways"/>',
                "<android.support.design.widget.TabLayout ",
                'app:layout_scrollFlags="scroll|enterAlways"/>',
                "</android.support.design.widget.AppBarLayout>",
                "</android.support.design.widget.CoordinatorLayout>",
            ].join(""))
        })
    })
})
