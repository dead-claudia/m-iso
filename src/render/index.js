import assert from "assert"

import * as _ from "../util.js"

import getType from "./types/index.js"
import * as common from "./common.js"
import Builder from "./types/builder.js"
import Wrapper from "./hooks.js"
import * as renderer from "./renderer.js"

function getXmlCross(type) {
    switch (type) {
    case "html": return "html-polyglot"
    case "html4": return "xhtml"
    default: return type
    }
}

function isXml(type) {
    return type === "html-polyglot" || type === "xhtml"
}

function parseVersion(version) {
    if (version == null) {
        return "1.1"
    } else if (typeof version === "number") {
        return version.toPrecision(2)
    } else {
        return version.toString()
    }
}

function getTypeCross(old, type) {
    if (old == null) {
        return type
    } else if (old === "xml") {
        return getXmlCross(type)
    } else if (type === "xml") {
        return getXmlCross(old)
    } else {
        return isXml(old) ? getXmlCross(type) : type
    }
}

class Renderer {
    constructor(type, voids, hooks) {
        this.kind = type
        this.voids = voids
        this.hooks = _.d(hooks, {})
        this.type = null
        this.next = "start"
        this.builder = null
    }

    getBuilder() {
        if (this.builder != null) return this.builder
        const ret = getType(this.kind != null ? this.kind : "html")
        return new Builder(
            ret.renderer,
            this.voids != null ? this.voids : ret.voids,
            new Wrapper(this.hooks))
    }

    set(type) {
        assert.equal(typeof type, "string")
        this.kind = getTypeCross(this.kind, type)
    }

    renderDoctype(children) {
        assert(Array.isArray(children))

        if (this.next === "body") {
            throw new Error("Cannot introduce declarations in body")
        }

        this.next = "doctype"

        if (children.length === 0) {
            throw new Error("Expected doctype to not be empty")
        }

        if (children.length > 1) {
            throw new Error("Too many doctype children")
        }

        const child = children[0]

        switch (child) {
        // HTML5: <!DOCTYPE html>
        case "html":
            this.set("html")
            return "<!DOCTYPE html>"

        // HTML 4.01 Strict:
        // <!DOCTYPE HTML PUBLIC
        //     "-//W3C//DTD HTML 4.01//EN"
        //     "http://www.w3.org/TR/html4/strict.dtd">
        case "html4-strict":
            this.set("html4")

            return '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" ' +
                '"http://www.w3.org/TR/html4/strict.dtd">'

        // HTML 4.01 Transitional:
        // <!DOCTYPE HTML PUBLIC
        //     "-//W3C//DTD HTML 4.01 Transitional//EN"
        //     "http://www.w3.org/TR/html4/loose.dtd">
        case "html4-transitional":
            this.set("html4")
            return "<!DOCTYPE HTML PUBLIC " +
                '"-//W3C//DTD HTML 4.01 Transitional//EN" ' +
                '"http://www.w3.org/TR/html4/loose.dtd">'

        // HTML 4.01 Frameset:
        // <!DOCTYPE HTML PUBLIC
        //     "-//W3C//DTD HTML 4.01 Frameset//EN"
        //     "http://www.w3.org/TR/html4/frameset.dtd">
        case "html4-frameset":
            this.set("html4")
            return "<!DOCTYPE HTML PUBLIC " +
                '"-//W3C//DTD HTML 4.01 Frameset//EN" ' +
                '"http://www.w3.org/TR/html4/frameset.dtd">'

        default:
            throw new Error(`Bad doctype name: ${child}`)
        }
    }

    renderXmlDeclaration(attrs) {
        assert(_.isObject(attrs))

        if (this.next === "body") {
            throw new Error("Cannot introduce declarations in body")
        } else if (this.next === "doctype") {
            throw new Error("Declaration must come before doctype")
        }

        this.next = "body"
        this.set("xml")

        const encoding = attrs.encoding != null ?
            attrs.encoding.toLowerCase() :
            "utf-8"

        const version = parseVersion(attrs.version)

        if (version !== "1.0" && version !== "1.1") {
            throw new Error(`Bad version number: ${version}`)
        }

        let str = `<?xml version="${version}" encoding="${encoding}"`

        let {standalone} = attrs

        if (standalone != null) {
            if (typeof attrs.standalone === "boolean") {
                standalone = standalone ? "yes" : "no"
            } else if (standalone !== "yes" && standalone !== "no") {
                /* eslint-disable prefer-template */
                throw new Error("Invalid value for `standalone` attribute: " +
                    JSON.stringify(standalone))
                /* eslint-enable prefer-template */
            }
            str += ` standalone="${standalone}"`
        }

        return `${str}?>`
    }

    renderBase(node) {
        node = common.resolveComponents(node)
        if (common.isNonNode(node)) {
            return common.escape(node)
        } else if (node.tag.toLowerCase() === "!doctype") {
            return renderer.trust(this.renderDoctype(node.children))
        } else if (node.tag === "?xml") {
            return renderer.trust(this.renderXmlDeclaration(node.attrs))
        } else {
            this.next = "body"
            const res = this.getBuilder().render(node)
            return res
        }
    }

    renderIterate(nodes, children) {
        if (Array.isArray(nodes)) {
            for (let i = 0; i < nodes.length; i++) {
                this.renderIterate(nodes[i], children)
            }
        } else {
            children.push(this.renderBase(nodes))
        }
        return children
    }

    render(nodes) {
        const children = this.renderIterate(nodes, [])
        return renderer.root(children)
    }
}

export function render(tree, type, voids, hooks) {
    return renderer.render(renderNode(tree, type, voids, hooks))
}

export function renderNode(tree, type, voids, hooks) {
    if (type != null && typeof type !== "string") {
        throw new Error("Expected `type` to be a string or not exist")
    }

    if (voids != null && !Array.isArray(voids)) {
        throw new Error("Expected `voids` to be an array or not exist")
    }

    if (hooks != null && typeof hooks === "object") {
        throw new Error("Expected `voids` to be an object or not exist")
    }

    return new Renderer(type, voids, hooks).render(tree)
}
