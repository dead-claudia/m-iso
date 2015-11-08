"use strict"

var m = require("../lib/constructor.js")
var render = require("../lib/render.js")

var sinon = require("sinon")
var chai = require("chai")
chai.use(require("sinon-chai"))
var expect = chai.expect

describe("m.render()", function () { // eslint-disable-line max-statements
    it("exists", function () {
        expect(render).to.be.a("function")
    })

    // Make void tags explicit for the sake of testing
    function makeTest(type) {
        return function (opts, tree, expected) {
            if (arguments.length === 2) {
                expected = tree
                tree = opts
                opts = {}
            }

            var voids = opts.voids || []
            if (voids === true) voids = undefined

            var res = render(
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

    context("type: *", function () { // eslint-disable-line max-statements
        var test = makeTest()

        it("renders nothing", function () {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", function () {
            test("foo", "foo")
        })

        it("escapes strings", function () {
            test("<foo a=\"1\" b='2'>&lt;", "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("doesn't escape trusted strings", function () {
            test(m.trust("<foo a=\"1\" b='2'>&lt;"), "<foo a=\"1\" b='2'>&lt;")
        })

        it("renders xml declarations with default encoding utf-8 and version 1.1", function () { // eslint-disable-line
            test(m("?xml"), "<?xml version='1.1' encoding='utf-8'?>")
        })

        it("renders xml declarations with explicit version 1.0", function () {
            test(m("?xml", {
                version: "1.0"
            }), "<?xml version='1.0' encoding='utf-8'?>")
        })

        it("renders xml declarations with explicit version 1.1", function () {
            test(m("?xml", {
                version: "1.1"
            }), "<?xml version='1.1' encoding='utf-8'?>")
        })

        it("renders xml declarations with encoding", function () {
            test(m("?xml", {
                encoding: "invalid"
            }), "<?xml version='1.1' encoding='invalid'?>")
        })

        it("renders xml declarations with standalone: \"yes\"", function () {
            test(m("?xml", {
                standalone: "yes"
            }), "<?xml version='1.1' encoding='utf-8' standalone='yes'?>")
        })

        it("renders xml declarations with standalone: \"no\"", function () {
            test(m("?xml", {
                standalone: "no"
            }), "<?xml version='1.1' encoding='utf-8' standalone='no'?>")
        })

        it("renders xml declarations with standalone: true", function () {
            test(m("?xml", {
                standalone: true
            }), "<?xml version='1.1' encoding='utf-8' standalone='yes'?>")
        })

        it("renders xml declarations with standalone: true", function () {
            test(m("?xml", {
                standalone: false
            }), "<?xml version='1.1' encoding='utf-8' standalone='no'?>")
        })

        it("renders html5 doctype", function () {
            test(m("!doctype", "html"), "<!DOCTYPE html>")
        })

        it("renders html4 strict doctype", function () {
            test(m("!doctype", "html4-strict"),
                '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
                '"http://www.w3.org/TR/html4/strict.dtd">')
        })

        it("renders html4 transitional doctype", function () {
            test(m("!doctype", "html4-transitional"),
                "<!DOCTYPE HTML PUBLIC " +
                '"-//W3C//DTD HTML 4.01 Transitional//EN" ' +
                '"http://www.w3.org/TR/html4/loose.dtd">')
        })

        it("renders html4 frameset doctype", function () {
            test(m("!doctype", "html4-frameset"),
                "<!DOCTYPE HTML PUBLIC " +
                '"-//W3C//DTD HTML 4.01 Frameset//EN" ' +
                '"http://www.w3.org/TR/html4/frameset.dtd">')
        })

        it("triggers XML behavior with XML declaration", function () {
            test([
                m("?xml"),
                m("img")
            ], "<?xml version='1.1' encoding='utf-8'?><img/>")
        })

        it("renders HTML by default", function () {
            test({voids: true}, m("img"), "<img>")
        })

        it("renders empty components correctly", function () {
            var component = {}
            test(m(component), "")
        })

        it("renders components with just a view correctly", function () {
            var component = {
                view: function () {
                    return "string"
                }
            }
            test(m(component), "string")
        })

        it("renders components with just a controller correctly", function () {
            var component = {
                controller: function () {
                    this.value = 1
                }
            }
            test(m(component), "")
        })

        it("renders components with a controller and view correctly", function () { // eslint-disable-line max-len
            var component = {
                controller: function () {
                    this.value = 1
                },

                view: function (ctrl) {
                    return ctrl.value
                }
            }

            test(m(component), "1")
        })

        it("renders components that generate nodes correctly", function () {
            test(m({
                view: function () {
                    return m("div", "foo")
                }
            }), "<div>foo</div>")
        })

        it("renders components that return other components correctly", function () { // eslint-disable-line max-len
            var sub = {
                view: function () {
                    return m("div", "foo")
                }
            }

            var component = {
                view: function () {
                    return m(sub)
                }
            }

            test(m(component), "<div>foo</div>")
        })

        it("renders components that directly return other components correctly", function () { // eslint-disable-line max-len
            var sub = {
                view: function () {
                    return m("div", "foo")
                }
            }

            var component = {
                view: function () {
                    return sub
                }
            }

            test(m(component), "<div>foo</div>")
        })

        it("renders components that return other nested components correctly", function () { // eslint-disable-line max-len
            var sub3 = {view: function () { return m("div", "foo") }}
            var sub2 = {view: function () { return sub3 }}
            var sub1 = {view: function () { return sub2 }}
            var sub = {view: function () { return sub1 }}

            var component = {
                view: function () {
                    return m(sub)
                }
            }

            test(m(component), "<div>foo</div>")
        })

        it("renders components that directly return other nested components correctly", function () { // eslint-disable-line max-len
            var sub3 = {view: function () { return m("div", "foo") }}
            var sub2 = {view: function () { return m(sub3) }}
            var sub1 = {view: function () { return m(sub2) }}
            var sub = {view: function () { return m(sub1) }}

            var component = {
                view: function () {
                    return sub
                }
            }

            test(m(component), "<div>foo</div>")
        })

        it("renders components that directly return other nested mixed components correctly", function () { // eslint-disable-line max-len
            var sub3 = {view: function () { return m("div", "foo") }}
            var sub2 = {view: function () { return m(sub3) }}
            var sub1 = {view: function () { return sub2 }}
            var sub = {view: function () { return sub1 }}

            var component = {
                view: function () {
                    return m(sub)
                }
            }

            test(m(component), "<div>foo</div>")
        })

        it("calls views once", function () {
            /* eslint-disable no-use-before-define */
            var spy3 = sinon.spy(function () { return m("div", "foo") })
            var spy2 = sinon.spy(function () { return m(sub3) })
            var spy1 = sinon.spy(function () { return sub2 })
            var spy0 = sinon.spy(function () { return sub1 })
            /* eslint-enable no-use-before-define */

            var sub3 = {view: spy3}
            var sub2 = {view: spy2}
            var sub1 = {view: spy1}
            var sub0 = {view: spy0}

            test(m(sub0), "<div>foo</div>")
            expect(spy3).to.have.been.calledOnce
            expect(spy2).to.have.been.calledOnce
            expect(spy1).to.have.been.calledOnce
            expect(spy0).to.have.been.calledOnce
        })

        it("calls controllers once", function () {
            /* eslint-disable no-use-before-define */
            var spy3 = sinon.spy()
            var spy2 = sinon.spy()
            var spy1 = sinon.spy()
            var spy0 = sinon.spy()
            /* eslint-enable no-use-before-define */

            var sub3 = {
                controller: spy3,
                view: function () { return m("div", "foo") }
            }

            var sub2 = {
                controller: spy2,
                view: function () { return m(sub3) }
            }

            var sub1 = {
                controller: spy1,
                view: function () { return sub2 }
            }

            var sub0 = {
                controller: spy0,
                view: function () { return sub1 }
            }

            test(m(sub0), "<div>foo</div>")
            expect(spy3).to.have.been.calledOnce
            expect(spy2).to.have.been.calledOnce
            expect(spy1).to.have.been.calledOnce
            expect(spy0).to.have.been.calledOnce
        })

        it("considers anything with a `view` property to be a component", function () { // eslint-disable-line max-len
            test({view: function () { return "string" }}, "string")
        })

        it("throws when given a component with a non-callable `view`", function () { // eslint-disable-line max-len
            expect(function () {
                render({view: 2})
            }).to.throw()

            expect(function () {
                render(m({view: 2}))
            }).to.throw()
        })

        it("throws when given a component that returns one with a non-callable view", function () { // eslint-disable-line max-len
            expect(function () {
                render({
                    view: function () {
                        return {view: 1}
                    }
                })
            }).to.throw()

            expect(function () {
                render(m({
                    view: function () {
                        return m({view: 1})
                    }
                }))
            }).to.throw()

            expect(function () {
                render(m({
                    view: function () {
                        return {view: 1}
                    }
                }))
            }).to.throw()
        })

        it("renders string event handlers to strings", function () {
            test({voids: true}, [
                m("!doctype", "html"),
                m("div#foo", {onclick: "doSomething()"})
            ], '<!DOCTYPE html><div id="foo" onclick="doSomething()"></div>')
        })

        it("renders function event handlers to strings", function () {
            test({voids: true}, [
                m("!doctype", "html"),
                m("div#foo", {onclick: function(){return doSomething()}}) // eslint-disable-line
            ], new RegExp('<!DOCTYPE html><div id="foo" onclick="return ' +
                "function\\s*\\(\\)\\s*\\{\\s*return doSomething\\(\\)\\s*\\}" +
                '.call\\(this\\)"></div>'))
        })
    })

    context("type: html", function () { // eslint-disable-line
        var test = makeTest("html")

        it("renders nothing", function () {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", function () {
            test("foo", "foo")
        })

        it("escapes strings", function () {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", function () {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", function () {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", function () {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", function () {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", function () {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", function () {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a><b>")
        })

        it("renders classes", function () {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", function () {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", function () {
            test([
                m("div", "foo")
            ], "<div>foo</div>")
        })

        it("renders child nodes", function () {
            test([
                m("div", m("a", "foo"))
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo")
            ], "<div><a>foo</div>")
        })

        it("ignores children on void nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a", "foo"))
            ], "<div><a></div>")
        })

        it("escapes children's strings", function () {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", function () {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", function () {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", function () {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar")
                ])
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", function () {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", function () {
            var list = [
                "area", "base", "br", "col", "embed", "hr", "img", "input",
                "keygen", "link", "menuitem", "meta", "param", "source",
                "track", "wbr"
            ]
            test({voids: true}, list.map(function (tag) {
                return m(tag + "#id", "value")
            }), list.map(function (tag) {
                return "<" + tag + " id=\"id\">"
            }).join(""))
        })

        it("renders complex pages without components", function () {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]")
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", m.trust("$('#body').append(getChild())"))
                ])
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
                "</body>"
            ].join(""))
        })

        it("renders nested SVG elements correctly", function () {
            test({voids: true}, m("div", [
                m("svg[xmlns=http://www.w3.org/2000/svg]", {
                    width: "100%",
                    height: "100%",
                    viewBox: "0 0 400 400",
                    "xmlns:xlink": "http://www.w3.org/1999/xlink"
                }, [
                    m("path", {
                        d: "M 100 100 L 300 100 L 200 300 z",
                        fill: "orange",
                        stroke: "black",
                        "stroke-width": 3
                    }),

                    m("a[xlink:href=http://svgwg.org][target=_blank]", [
                        m("rect[height=30][width=120][y=0][x=0][rx=15]"),
                        m("text[fill=white][text-anchor=middle][y=21][x=60]",
                            "SVG WG website")
                    ])
                ]),
                m("img[src=/image.png]")
            ]), [
                '<div><svg xmlns="http://www.w3.org/2000/svg" width="100%" ',
                'height="100%" viewBox="0 0 400 400" ',
                'xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<path d="M 100 100 L 300 100 L 200 300 z" fill="orange" ',
                'stroke="black" stroke-width="3"/>',
                '<a xlink:href="http://svgwg.org" target="_blank">',
                '<rect height="30" width="120" y="0" x="0" rx="15"/>',
                '<text fill="white" text-anchor="middle" y="21" x="60">',
                'SVG WG website</text></a></svg><img src="/image.png"></div>'
            ].join(""))
        })

        it("renders nested MathML elements correctly", function () {
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
                                m("mn", "3")
                            ])),
                            m("mtd[columnalign=left]", m("mrow", [
                                m("mtext", m.trust("if&nbsp;")),
                                m("mn", "0"),
                                m("mo", m.trust("&leq;")),
                                m("mi", "x"),
                                m("mo", m.trust("&leq;")),
                                m("mn", "1"),
                                m("mo", ";")
                            ]))
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mn", "2"),
                                m("mo", "/"),
                                m("mn", "3")
                            ])),
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mtext", m.trust("if&nbsp;")),
                                m("mn", "3"),
                                m("mo", m.trust("&leq;")),
                                m("mi", "x"),
                                m("mo", m.trust("&leq;")),
                                m("mn", "4"),
                                m("mo", ";")
                            ]))
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mn", "0")),
                            m("mtd[columnalign=left]", m("mtext", "elsewhere."))
                        ])
                    ]))
                ])),
                m("img[src=/image.png]")
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
                '</mtable></mrow></mrow></math><img src="/image.png"></div>'
            ].join(""))
        })
    })

    context("type: html-polygot", function () { // eslint-disable-line
        var test = makeTest("html-polygot")

        it("renders nothing", function () {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", function () {
            test("foo", "foo")
        })

        it("escapes strings", function () {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", function () {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", function () {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", function () {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", function () {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", function () {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", function () {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a/><b/>")
        })

        it("renders classes", function () {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", function () {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", function () {
            test([
                m("div", "foo")
            ], "<div>foo</div>")
        })

        it("renders child nodes", function () {
            test([
                m("div", m("a", "foo"))
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo")
            ], "<div><a/>foo</div>")
        })

        it("ignores children on void nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a", "foo"))
            ], "<div><a/></div>")
        })

        it("escapes children's strings", function () {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", function () {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", function () {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", function () {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar")
                ])
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", function () {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", function () {
            var list = [
                "area", "base", "br", "col", "embed", "hr", "img", "input",
                "keygen", "link", "menuitem", "meta", "param", "source",
                "track", "wbr"
            ]
            test({voids: true}, list.map(function (tag) {
                return m(tag + "#id", "value")
            }), list.map(function (tag) {
                return "<" + tag + " id=\"id\"/>"
            }).join(""))
        })

        it("renders complex pages without components", function () {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]")
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", m.trust("$('#body').append(getChild())"))
                ])
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
                "</body>"
            ].join(""))
        })

        it("renders nested SVG elements correctly", function () {
            test({voids: true}, m("div", [
                m("svg[xmlns=http://www.w3.org/2000/svg]", {
                    width: "100%",
                    height: "100%",
                    viewBox: "0 0 400 400",
                    "xmlns:xlink": "http://www.w3.org/1999/xlink"
                }, [
                    m("path", {
                        d: "M 100 100 L 300 100 L 200 300 z",
                        fill: "orange",
                        stroke: "black",
                        "stroke-width": 3
                    }),
                    m("a[xlink:href=http://svgwg.org][target=_blank]", [
                        m("rect[height=30][width=120][y=0][x=0][rx=15]"),
                        m("text[fill=white][text-anchor=middle][y=21][x=60]",
                            "SVG WG website")
                    ])
                ]),
                m("img[src=/image.png]")
            ]), [
                '<div><svg xmlns="http://www.w3.org/2000/svg" width="100%" ',
                'height="100%" viewBox="0 0 400 400" ',
                'xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<path d="M 100 100 L 300 100 L 200 300 z" fill="orange" ',
                'stroke="black" stroke-width="3"/>',
                '<a xlink:href="http://svgwg.org" target="_blank">',
                '<rect height="30" width="120" y="0" x="0" rx="15"/>',
                '<text fill="white" text-anchor="middle" y="21" x="60">',
                'SVG WG website</text></a></svg><img src="/image.png"/></div>'
            ].join(""))
        })

        it("renders nested MathML elements correctly", function () {
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
                                m("mn", "3")
                            ])),
                            m("mtd[columnalign=left]", m("mrow", [
                                m("mtext", m.trust("if&nbsp;")),
                                m("mn", "0"),
                                m("mo", m.trust("&leq;")),
                                m("mi", "x"),
                                m("mo", m.trust("&leq;")),
                                m("mn", "1"),
                                m("mo", ";")
                            ]))
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mn", "2"),
                                m("mo", "/"),
                                m("mn", "3")
                            ])),
                            m("mtd[columnalign=center]", m("mrow", [
                                m("mtext", m.trust("if&nbsp;")),
                                m("mn", "3"),
                                m("mo", m.trust("&leq;")),
                                m("mi", "x"),
                                m("mo", m.trust("&leq;")),
                                m("mn", "4"),
                                m("mo", ";")
                            ]))
                        ]),
                        m("mtr", [
                            m("mtd[columnalign=center]", m("mn", "0")),
                            m("mtd[columnalign=left]", m("mtext", "elsewhere."))
                        ])
                    ]))
                ])),
                m("img[src=/image.png]")
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
                '</mtable></mrow></mrow></math><img src="/image.png"/></div>'
            ].join(""))
        })
    })

    context("type: html4", function () { // eslint-disable-line
        var test = makeTest("html4")

        it("renders nothing", function () {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", function () {
            test("foo", "foo")
        })

        it("escapes strings", function () {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", function () {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", function () {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", function () {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", function () {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", function () {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", function () {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a><b>")
        })

        it("renders classes", function () {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", function () {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", function () {
            test([
                m("div", "foo")
            ], "<div>foo</div>")
        })

        it("renders child nodes", function () {
            test([
                m("div", m("a", "foo"))
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo")
            ], "<div><a>foo</div>")
        })

        it("ignores children on void nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a", "foo"))
            ], "<div><a></div>")
        })

        it("escapes children's strings", function () {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", function () {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", function () {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", function () {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar")
                ])
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", function () {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", function () {
            var list = [
                "area", "base", "basefont", "br", "col", "frame", "hr", "img",
                "input", "isindex", "link", "meta", "param"
            ]
            test({voids: true}, list.map(function (tag) {
                return m(tag + "#id", "value")
            }), list.map(function (tag) {
                return "<" + tag + " id=\"id\">"
            }).join(""))
        })

        it("renders complex pages without components", function () {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]")
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", m.trust("$('#body').append(getChild())"))
                ])
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
                "</body>"
            ].join(""))
        })
    })

    context("type: xhtml", function () { // eslint-disable-line
        var test = makeTest("xhtml")

        it("renders nothing", function () {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", function () {
            test("foo", "foo")
        })

        it("escapes strings", function () {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", function () {
            test(m("div"), "<div></div>")
        })

        it("renders a single div in an array", function () {
            test([m("div")], "<div></div>")
        })

        it("renders a single span in an array", function () {
            test([m("span")], "<span></span>")
        })

        it("renders multiple elements in an array", function () {
            test([m("div"), m("span")], "<div></div><span></span>")
        })

        it("renders highly nested arrays of elements", function () {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div></div><a></a><em>word</em>")
        })

        it("renders void elements", function () {
            test({voids: ["a", "b"]}, [m("a"), m("b")], "<a/><b/>")
        })

        it("renders classes", function () {
            test([m("div.foo")], "<div class=\"foo\"></div>")
        })

        it("renders ids", function () {
            test([m("div#foo")], "<div id=\"foo\"></div>")
        })

        it("renders child strings", function () {
            test([
                m("div", "foo")
            ], "<div>foo</div>")
        })

        it("renders child nodes", function () {
            test([
                m("div", m("a", "foo"))
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo")
            ], "<div><a/>foo</div>")
        })

        it("ignores children on void nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a", "foo"))
            ], "<div><a/></div>")
        })

        it("escapes children's strings", function () {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", function () {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"></div>")
        })

        it("renders children's attributes", function () {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"></span></div>")
        })

        it("renders multiple children", function () {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar")
                ])
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", function () {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders preset voids when told to", function () {
            var list = [
                "area", "base", "basefont", "br", "col", "frame", "hr", "img",
                "input", "isindex", "link", "meta", "param"
            ]
            test({voids: true}, list.map(function (tag) {
                return m(tag + "#id", "value")
            }), list.map(function (tag) {
                return "<" + tag + " id=\"id\"/>"
            }).join(""))
        })

        it("renders complex pages without components", function () {
            test({voids: true}, [
                m("!doctype", "html"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]")
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", m.trust("$('#body').append(getChild())"))
                ])
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
                "</body>"
            ].join(""))
        })
    })

    context("type: xml", function () { // eslint-disable-line
        var test = makeTest("xml")

        it("renders nothing", function () {
            test(undefined, "")
            test(null, "")
        })

        it("renders strings", function () {
            test("foo", "foo")
        })

        it("escapes strings", function () {
            test("<foo a=\"1\" b='2'>&lt;",
                "&lt;foo a=\"1\" b='2'>&amp;lt;")
        })

        it("renders a single div", function () {
            test(m("div"), "<div/>")
        })

        it("renders a single empty div in an array", function () {
            test([m("div")], "<div/>")
        })

        it("renders a single empty span in an array", function () {
            test([m("span")], "<span/>")
        })

        it("renders multiple empty elements in an array", function () {
            test([m("div"), m("span")], "<div/><span/>")
        })

        it("renders highly nested arrays of mixed elements", function () {
            test([[[m("div")]], [m("a"), [[[m("em", "word")]]]]],
                "<div/><a/><em>word</em>")
        })

        it("renders classes on className", function () {
            test([m("div.foo")], "<div className=\"foo\"/>")
        })

        it("renders ids", function () {
            test([m("div#foo")], "<div id=\"foo\"/>")
        })

        it("renders child strings", function () {
            test([
                m("div", "foo")
            ], "<div>foo</div>")
        })

        it("renders child nodes", function () {
            test([
                m("div", m("a", "foo"))
            ], "<div><a>foo</a></div>")
        })

        it("renders void child nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a"), "foo")
            ], "<div><a/>foo</div>")
        })

        it("ignores void nodes", function () {
            test({voids: ["a"]}, [
                m("div", m("a", "foo"))
            ], "<div><a>foo</a></div>")
        })

        it("escapes children's strings", function () {
            test(m("a", "<foo a=\"1\" b='2'>&lt;"),
                "<a>&lt;foo a=\"1\" b='2'>&amp;lt;</a>")
        })

        it("renders attributes", function () {
            test(m("div", {foo: "bar"}), "<div foo=\"bar\"/>")
        })

        it("renders children's attributes", function () {
            test(m("div", m("span", {foo: "bar"})),
                "<div><span foo=\"bar\"/></div>")
        })

        it("renders multiple children", function () {
            test([
                m("div", [
                    m("span", "foo"),
                    m("a", "bar")
                ])
            ], "<div><span>foo</span><a>bar</a></div>")
        })

        it("doesn't render preset voids when passed a void list", function () {
            test(m("img", "foo"), "<img>foo</img>")
        })

        it("renders complex pages without components", function () {
            test({voids: true}, [
                m("?xml"),
                m("head", [
                    m("script[src=//code.jquery.com/jquery-2.1.4.min.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap.css]"),
                    m("script[src=/static/bootstrap.js]"),
                    m("link[rel=stylesheet][href=/static/bootstrap-theme.css]"),
                    m("script[src=/static/index.js]")
                ]),
                m("body", [
                    m("img[src=/static/image.png]"),
                    m("#body"),
                    m("script", m("!CDATA", "$('#body').append(getChild())"))
                ])
            ], [
                "<?xml version='1.1' encoding='utf-8'?>",
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
                "</body>"
            ].join(""))
        })

        it("renders attributes with hyphens and namespaces correctly", function () { // eslint-disable-line max-len
            test({voids: true}, m("div", [
                m("svg[xmlns=http://www.w3.org/2000/svg]", {
                    width: "100%",
                    height: "100%",
                    viewBox: "0 0 400 400",
                    "xmlns:xlink": "http://www.w3.org/1999/xlink"
                }, [
                    m("path", {
                        d: "M 100 100 L 300 100 L 200 300 z",
                        fill: "orange",
                        stroke: "black",
                        "stroke-width": 3
                    }),
                    m("a[xlink:href=http://svgwg.org][target=_blank]", [
                        m("rect[height=30][width=120][y=0][x=0][rx=15]"),
                        m("text[fill=white][text-anchor=middle][y=21][x=60]",
                            "SVG WG website")
                    ])
                ]),
                m("img[src=/image.png]")
            ]), [
                '<div><svg xmlns="http://www.w3.org/2000/svg" width="100%" ',
                'height="100%" viewBox="0 0 400 400" ',
                'xmlns:xlink="http://www.w3.org/1999/xlink">',
                '<path d="M 100 100 L 300 100 L 200 300 z" fill="orange" ',
                'stroke="black" stroke-width="3"/>',
                '<a xlink:href="http://svgwg.org" target="_blank">',
                '<rect height="30" width="120" y="0" x="0" rx="15"/>',
                '<text fill="white" text-anchor="middle" y="21" x="60">',
                'SVG WG website</text></a></svg><img src="/image.png"/></div>'
            ].join(""))
        })

        it("renders namespaced elements correctly", function () {
            test({voids: true}, m("xsl:stylesheet[version=1.0]", {
                "xmlns:xsl": "http://www.w3.org/1999/XSL/Transform"
            }, [
                m("xsl:template[match=/hello-world]", m("html", [
                    m("head", m("title")),
                    m("body", [
                        m("h1", m("xsl:value-of[select=greeting]")),
                        m("xsl:apply-templates[select=greeter]")
                    ])
                ])),
                m("xsl:template[match=greeter]", [
                    m("div", [
                        "from ", m("i", m("xsl:value-of[select='.']"))
                    ])
                ])
            ]), [
                '<xsl:stylesheet version="1.0" ',
                'xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
                '<xsl:template match="/hello-world"><html><head><title/>',
                '</head><body><h1><xsl:value-of select="greeting"/></h1>',
                '<xsl:apply-templates select="greeter"/></body></html>',
                '</xsl:template><xsl:template match="greeter"><div>from ',
                '<i><xsl:value-of select="."/></i></div></xsl:template>',
                "</xsl:stylesheet>"
            ].join(""))
        })

        it("renders names with punctuation in them correctly", function () {
            test({voids: true}, [
                m.r("android.support.design.widget.CoordinatorLayout", {
                    "xmlns:android": "http://schemas.android.com/apk/res/android", // eslint-disable-line
                    "xmlns:app": "http://schemas.android.com/apk/res-auto",
                    "android:layout_width": "match_parent",
                    "android:layout_height": "match_parent"
                }, [
                    m.r("android.support.v7.widget.RecyclerView", {
                        "android:layout_width": "match_parent",
                        "android:layout_height": "match_parent",
                        "app:layout_behavior": "@string/appbar_view_behavior"
                    }),
                    m.r("android.support.design.widget.AppBarLayout", {
                        "android:layout_width": "match_parent",
                        "android:layout_height": "wrap_content"
                    }, [
                        m.r("android.support.v7.widget.Toolbar", {
                            "app:layout_scrollFlags": "scroll|enterAlways"
                        }),
                        m.r("android.support.design.widget.TabLayout", {
                            "app:layout_scrollFlags": "scroll|enterAlways"
                        })
                    ])
                ])
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
                "</android.support.design.widget.CoordinatorLayout>"
            ].join(""))
        })
    })
})
