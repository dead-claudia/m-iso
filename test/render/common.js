import * as common from "../../src/render/common.js"

import * as sinon from "sinon"
import chai, {expect} from "chai"
import sinonChai from "sinon-chai"
chai.use(sinonChai)

describe("render/common", () => {
    describe("isNonNode()", () => {
        it("exists", () => {
            expect(common.isNonNode).to.be.a("function")
        })

        it("doesn't see a non-object as a node", () => {
            expect(common.isNonNode("foo")).to.be.true
            expect(common.isNonNode(1)).to.be.true
            expect(common.isNonNode(true)).to.be.true
            expect(common.isNonNode(false)).to.be.true
            expect(common.isNonNode(null)).to.be.true
            expect(common.isNonNode(undefined)).to.be.true
            expect(common.isNonNode(() => {})).to.be.true
        })

        it("doesn't see an array as a node", () => {
            expect(common.isNonNode([])).to.be.true
            expect(common.isNonNode(["foo"])).to.be.true
            expect(common.isNonNode([1, 2, 3, 4, 5, 6])).to.be.true
        })

        it("doesn't see an empty object as a node", () => {
            expect(common.isNonNode({})).to.be.true
        })

        it("sees an object with a tag as a node", () => {
            expect(common.isNonNode({tag: "foo"})).to.be.false
        })

        it("sees an object with a view to be a node", () => {
            expect(common.isNonNode({view() {}})).to.be.false
        })

        it("sees an object with a subtree to be a node", () => {
            expect(common.isNonNode({subtree: true})).to.be.false
            expect(common.isNonNode({subtree: false})).to.be.false
        })

        it("doesn't see an object with an arbitrary key as a node", () => {
            expect(common.isNonNode({foo: "bar"})).to.be.true
        })
    })

    describe("resolveComponents()", () => {
        it("exists", () => {
            expect(common.resolveComponents).to.be.a("function")
        })

        it("resolves nested components", () => {
            const node = {tag: "div", children: ["foo"]}
            const sub3 = {view: () => node}
            const sub2 = {view: () => sub3}
            const sub1 = {view: () => sub2}
            const sub = {view: () => sub1}

            expect(common.resolveComponents({view: () => sub})).to.equal(node)
        })

        it("resolves nested components with controllers", () => { // eslint-disable-line max-statements, max-len
            const node = {tag: "div", attrs: {}, children: ["foo"]}

            const ctrl3 = sinon.spy()
            const view3 = sinon.spy(() => node)
            const sub3 = {controller: ctrl3, view: view3}

            const ctrl2 = sinon.spy()
            const view2 = sinon.spy(() => sub3)
            const sub2 = {controller: ctrl2, view: view2}

            const ctrl1 = sinon.spy()
            const view1 = sinon.spy(() => sub2)
            const sub1 = {controller: ctrl1, view: view1}

            const ctrl0 = sinon.spy()
            const view0 = sinon.spy(() => sub1)
            const sub0 = {controller: ctrl0, view: view0}

            expect(common.resolveComponents(sub0)).to.equal(node)

            expect(ctrl3).to.be.calledWithNew
            expect(view3).to.be.calledWith(ctrl3.thisValues[0])

            expect(ctrl2).to.be.calledWithNew
            expect(view2).to.be.calledWith(ctrl2.thisValues[0])

            expect(ctrl1).to.be.calledWithNew
            expect(view1).to.be.calledWith(ctrl1.thisValues[0])

            expect(ctrl0).to.be.calledWithNew
            expect(view0).to.be.calledWith(ctrl0.thisValues[0])
        })

        it("resolves nodes", () => {
            function check(node) {
                expect(common.resolveComponents(node)).to.equal(node)
            }

            check({tag: "div", attrs: {}, children: ["foo"]})
            check({subtree: true})
            check({subtree: false})
        })

        it("resolves plain objects", () => {
            const node = {}
            expect(common.resolveComponents(node)).to.equal(node)
        })

        it("resolves anything else", () => {
            function check(node) {
                expect(common.resolveComponents(node)).to.equal(node)
            }

            check("foo")
            check(1)
            check(true)
            check(false)
            check(null)
            check(undefined)
            check(() => {})
            check([])
            check(["foo"])
            check([1, 2, 3, 4, 5, 6])
        })
    })

    describe("escape()", () => {
        const renderer = require("../../src/render/renderer.js")
        const trust = require("../../src/constructor.js").trust

        it("exists", () => {
            expect(common.escape).to.be.a("function")
        })

        it("trusts trusted strings", () => {
            expect(common.escape(trust("foo"))).to.eql(renderer.trust("foo"))
        })

        it("renders `null`s and `undefined`s to empty strings", () => {
            expect(common.escape(null)).to.equal("")
            expect(common.escape(undefined)).to.equal("")
            expect(common.escape()).to.equal("")
        })

        // Only check this if Symbols exist natively.
        if (typeof Symbol === "function" && typeof Symbol() === "symbol") {
            it("renders symbols correctly", () => {
                expect(common.escape(Symbol("foo"))).to.equal("Symbol(foo)")
            })
        }

        it("renders strings correctly", () => {
            expect(common.escape("foo")).to.equal("foo")
        })

        it("renders numbers correctly", () => {
            expect(common.escape(12345)).to.equal("12345")
        })

        it("renders booleans correctly", () => {
            expect(common.escape(true)).to.equal("true")
            expect(common.escape(false)).to.equal("false")
        })

        it("renders other objects correctly", () => {
            expect(common.escape({})).to.equal("[object Object]")
            expect(common.escape({toString() {
                return "foo"
            }})).to.equal("foo")
        })
    })
})
