import m, * as mithril from "../debug/constructor.js"
const {r} = mithril

import * as sinon from "sinon"
import chai, {expect} from "chai"
import sinonChai from "sinon-chai"
chai.use(sinonChai)

describe("constructor", () => { // eslint-disable-line max-statements
    describe("default m()", () => { // eslint-disable-line max-statements
        it("exists", () => {
            expect(m).to.be.a("function")
        })

        it("sets correct tag name", () => {
            expect(m("div")).to.have.property("tag", "div")
        })

        it("sets correct class name", () => {
            expect(m(".foo")).to.have.deep.property("attrs.className", "foo")
        })

        it("sets correct tag name with only an attr", () => {
            expect(m("[title=bar]")).to.have.property("tag", "div")
        })

        it("sets correct unquoted attr", () => {
            expect(m("[title=bar]"))
                .to.have.deep.property("attrs.title", "bar")
        })

        it("sets correct single quoted attr", () => {
            expect(m("[title='bar']"))
                .to.have.deep.property("attrs.title", "bar")
        })

        it("sets correct double quoted attr", () => {
            expect(m('[title="bar"]'))
                .to.have.deep.property("attrs.title", "bar")
        })

        it("sets correct children with 1 string arg", () => {
            expect(m("div", "test"))
                .to.have.property("children")
                .that.eqls(["test"])
        })

        it("sets correct children with multiple string args", () => {
            expect(m("div", "test", "test2"))
                .to.have.property("children")
                .that.eqls(["test", "test2"])
        })

        it("sets correct children with string array", () => {
            expect(m("div", ["test"]))
                .to.have.property("children")
                .that.eqls(["test"])
        })

        it("sets correct attrs with object", () => {
            expect(m("div", {title: "bar"}, "test"))
                .to.have.deep.property("attrs.title", "bar")
        })

        it("sets correct children with attrs object", () => {
            expect(m("div", {title: "bar"}, "test"))
                .to.have.property("children")
                .that.eqls(["test"])
        })

        it("sets correct children with nested node", () => {
            expect(m("div", {title: "bar"}, m("div")))
                .to.have.property("children")
                .that.eqls([m("div")])
        })

        it("sets correct children with string rest arg", () => {
            expect(m("div", {title: "bar"}, "test0", "test1", "test2", "test3"))
                .to.have.property("children")
                .that.eqls(["test0", "test1", "test2", "test3"])
        })

        it("sets correct children with node rest arg", () => {
            expect(m("div", {title: "bar"}, m("div"), m("i"), m("span")))
                .to.have.property("children")
                .that.eqls([m("div"), m("i"), m("span")])
        })

        it("sets correct children with string array & no attrs", () => {
            expect(m("div", ["a", "b"]))
                .to.have.property("children")
                .that.eqls(["a", "b"])
        })

        it("sets correct children with node array & no attrs", () => {
            expect(m("div", [m("div"), m("i")]))
                .to.have.property("children")
                .that.eqls([m("div"), m("i")])
        })

        it("sets correct children with 2nd arg as node", () => {
            expect(m("div", m("div")))
                .to.have.property("children")
                .that.eqls([m("div")])
        })

        it("sets correct tag with undefined array entry", () => {
            expect(m("div", [undefined])).to.have.property("tag", "div")
        })

        it("loosely accepts invalid objects", () => {
            expect(() => m("div", [{foo: "bar"}])).to.not.throw()
        })

        it("accepts svg nodes", () => {
            expect(m("svg", [m("g")]))
                .to.have.property("children")
                .that.eqls([m("g")])
        })

        it("renders SVG children", () => {
            expect(m("svg", [m("a[href='http://google.com']")]))
                .to.have.property("children")
                .that.eqls([m("a[href='http://google.com']")])
        })

        it("uses className if given", () => {
            expect(m(".foo", {className: ""}))
                .to.have.deep.property("attrs.className", "foo")
        })

        it("accepts a class and class attr", () => {
            const node = m(".foo", {class: "bar"})

            expect(node).to.have.deep.property("attrs.class")
            expect(node.attrs.class).to.include("foo").and.include("bar")
        })

        it("accepts a class and className attr", () => {
            const node = m(".foo", {className: "bar"})

            expect(node).to.have.deep.property("attrs.className")
            expect(node.attrs.className).to.include("foo").and.include("bar")
        })

        it("sets an empty className attr if it's an empty string", () => {
            expect(m("div", {className: ""}))
                .to.have.deep.property("attrs.className", "")
        })

        it("does not set className attr if class is given", () => {
            expect(m("div", {class: ""}))
                .to.not.have.property("attrs.className")
        })

        it("does not set class attr if className is given", () => {
            expect(m("div", {className: ""}))
                .to.not.have.property("attrs.class")
        })

        it("sets an empty class attr if it's an empty string", () => {
            expect(m("div", {class: ""}))
                .to.have.deep.property("attrs.class", "")
        })

        it("does not flatten 1 nested array", () => {
            expect(m("div", [1, 2, 3], 4))
                .to.have.property("children")
                .that.eqls([[1, 2, 3], 4])
        })

        it("does not flatten 2 nested arrays", () => {
            expect(m("div", [1, 2, 3], [4, 5, 6, 7]))
                .to.have.property("children")
                .that.eqls([[1, 2, 3], [4, 5, 6, 7]])
        })

        it("does not flatten 3 nested arrays", () => {
            expect(m("div", [1], [2], [3]))
                .to.have.property("children")
                .that.eqls([[1], [2], [3]])
        })

        it("doesn't recreate the DOM when classes are different", () => {
            const v1 = m(".foo", {
                class: "",
                onclick() {},
            })

            const v2 = m(".foo", {
                class: "bar",
                onclick() {},
            })

            expect(v1).to.have.property("attrs")
                .that.contains.all.keys("class", "onclick")
            expect(v2).to.have.property("attrs")
                .that.contains.all.keys("class", "onclick")
        })

        it("correctly encodes trusted strings", () => {
            const node = m("div", mithril.trust("foo"))
            expect(node.children[0].valueOf()).to.equal("foo")
        })

        it("proxies an object first arg to m.component()", () => {
            const spy = sinon.spy()

            const component = {
                controller: spy,
                view() {
                    return m("div", "testing")
                },
            }

            const args = {age: 12}

            m(component, args).controller()
            expect(spy).to.have.been.calledWith(args)
        })
    })

    describe("r()", () => { // eslint-disable-line max-statements
        it("exists", () => {
            expect(r).to.be.a("function")
        })

        it("sets correct tag name", () => {
            expect(r("div")).to.have.property("tag", "div")
        })

        it("doesn't interpret class syntax", () => {
            expect(r(".foo")).to.have.property("tag", ".foo")
        })

        it("doesn't add classes to property", () => {
            expect(r(".foo")).to.have.property("attrs").that.eqls({})
        })

        it("doesn't interpret attr syntax", () => {
            expect(r("[title=bar]")).to.have.property("tag", "[title=bar]")
        })

        it("doesn't add attrs with attr syntax", () => {
            expect(r("[title=bar]")).to.have.property("attrs").that.eqls({})
        })

        it("doesn't interpret single quoted attr", () => {
            expect(r("[title='bar']")).to.eql({
                tag: "[title='bar']",
                attrs: {},
                children: [],
            })
        })

        it("doesn't interpret double quoted attr", () => {
            expect(r('[title="bar"]')).to.eql({
                tag: '[title="bar"]',
                attrs: {},
                children: [],
            })
        })

        it("sets correct children with 1 string arg", () => {
            expect(r("div", "test"))
                .to.have.property("children")
                .that.eqls(["test"])
        })

        it("sets correct children with multiple string args", () => {
            expect(r("div", "test", "test2"))
                .to.have.property("children")
                .that.eqls(["test", "test2"])
        })

        it("sets correct children with string array", () => {
            expect(r("div", ["test"]))
                .to.have.property("children")
                .that.eqls(["test"])
        })

        it("sets correct attrs with object", () => {
            expect(r("div", {title: "bar"}, "test"))
                .to.have.deep.property("attrs.title", "bar")
        })

        it("sets correct children with attrs object", () => {
            expect(r("div", {title: "bar"}, "test"))
                .to.have.property("children")
                .that.eqls(["test"])
        })

        it("sets correct children with nested node", () => {
            expect(r("div", {title: "bar"}, r("div")))
                .to.have.property("children")
                .that.eqls([r("div")])
        })

        it("sets correct children with string rest arg", () => {
            expect(r("div", {title: "bar"}, "test0", "test1", "test2"))
                .to.have.property("children")
                .that.eqls(["test0", "test1", "test2"])
        })

        it("sets correct children with node rest arg", () => {
            expect(r("div", {title: "bar"}, r("div"), r("i")))
                .to.have.property("children")
                .that.eqls([r("div"), r("i")])
        })

        it("sets correct children with string array & no attrs", () => {
            expect(r("div", ["a", "b"]))
                .to.have.property("children")
                .that.eqls(["a", "b"])
        })

        it("sets correct children with node array & no attrs", () => {
            expect(r("div", [r("div"), r("i")]))
                .to.have.property("children")
                .that.eqls([r("div"), r("i")])
        })

        it("sets correct children with 2nd arg as node", () => {
            expect(r("div", r("div")))
                .to.have.property("children")
                .that.eqls([r("div")])
        })

        it("sets correct tag with undefined array entry", () => {
            expect(r("div", [undefined])).to.have.property("tag", "div")
        })

        it("loosely accepts invalid objects", () => {
            expect(() => r("div", [{foo: "bar"}])).to.not.throw()
        })

        it("accepts svg nodes", () => {
            expect(r("svg", [r("g")]))
                .to.have.property("children")
                .that.eqls([r("g")])
        })

        it("renders SVG children", () => {
            expect(r("svg", [r("a[href='http://google.com']")]))
                .to.have.property("children")
                .that.eqls([r("a[href='http://google.com']")])
        })

        it("sets an empty className attr if it's an empty string", () => {
            expect(r("div", {className: ""}))
                .to.have.deep.property("attrs.className", "")
        })

        it("does not set className attr if class is given", () => {
            expect(r("div", {class: ""}))
                .to.not.have.property("attrs.className")
        })

        it("does not set class attr if className is given", () => {
            expect(r("div", {className: ""}))
                .to.not.have.property("attrs.class")
        })

        it("sets an empty class attr if it's an empty string", () => {
            expect(r("div", {class: ""}))
                .to.have.deep.property("attrs.class", "")
        })

        it("does not flatten 1 nested array", () => {
            expect(r("div", [1, 2, 3], 4))
                .to.have.property("children")
                .that.eqls([[1, 2, 3], 4])
        })

        it("does not flatten 2 nested arrays", () => {
            expect(r("div", [1, 2, 3], [4, 5, 6, 7]))
                .to.have.property("children")
                .that.eqls([[1, 2, 3], [4, 5, 6, 7]])
        })

        it("does not flatten 3 nested arrays", () => {
            expect(r("div", [1], [2], [3]))
                .to.have.property("children")
                .that.eqls([[1], [2], [3]])
        })

        it("doesn't recreate the DOM when classes are different", () => {
            const v1 = r(".foo", {
                class: "",
                onclick() {},
            })

            const v2 = r(".foo", {
                class: "bar",
                onclick() {},
            })

            expect(v1).to.have.property("attrs")
                .that.contains.all.keys("class", "onclick")
            expect(v2).to.have.property("attrs")
                .that.contains.all.keys("class", "onclick")
        })

        it("correctly encodes trusted strings", () => {
            const node = m("div", mithril.trust("foo"))
            expect(node.children[0].valueOf()).to.equal("foo")
        })

        it("proxies an object first arg to m.component()", () => {
            const spy = sinon.spy()

            const component = {
                controller: spy,
                view() {
                    return m("div", "testing")
                },
            }

            const args = {age: 12}

            r(component, args).controller()
            expect(spy).to.have.been.calledWith(args)
        })
    })

    describe("component()", () => {
        it("exists", () => {
            expect(mithril.component).to.be.a("function")
        })

        it("works", () => {
            const spy = sinon.spy()

            const component = {
                controller: spy,
                view() {
                    return m("div", "testing")
                },
            }

            const args = {age: 12}

            mithril.component(component, args).controller()
            expect(spy).to.have.been.calledWith(args)
        })
    })
})
