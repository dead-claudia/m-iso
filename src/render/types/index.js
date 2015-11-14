import assert from "assert"

import * as _ from "../../util.js"

const domAlias = _.hash({className: "class"})

const xmlStaticCheck = {
    type: 2,
    void: false,
}

export const SVGRenderer = {
    print: _.identity,

    check() {
        return xmlStaticCheck
    },

    subtree: _.hash({
        foreignObject(node, opts) {
            return this.render(opts.parent, node, opts.voids)
        },
    }),

    aliases: domAlias,
}

function cdataText(child) {
    if (child == null) {
        return ""
    } else if (Array.isArray(child)) {
        let str = ""
        for (let i = 0; i < child.length; i++) {
            str += cdataText(child[i])
        }
        return str
    } else if (typeof child === "symbol") {
        return String(child)
    } else {
        return `${child}`
    }
}

/** @this */
function cdata(node) {
    return this.str(`<![CDATA[${cdataText(node.children)}]]>`)
}

export const XMLRenderer = {
    print: _.identity,

    check() {
        return xmlStaticCheck
    },

    aliases: _.hash(),
    subtree: _.hash({"!CDATA": cdata}),
}

const legacyVoids = [
    "area", "base", "basefont", "br", "col", "frame", "hr", "img", "input",
    "isindex", "link", "meta", "param",
]

const htmlVoids = [
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr",
]

const htmlSubtree = {
    svg(node, voids, parent) {
        return this.render(SVGRenderer, node, {parent, voids})
    },

    math(node) {
        return this.render(XMLRenderer, node, [])
    },
}

export const HTMLRenderer = {
    check(node, voids) {
        const isVoid = voids.indexOf(node.tag) >= 0
        return {
            void: isVoid,
            type: isVoid|0,
        }
    },

    print(tag) {
        return tag.toLowerCase()
    },

    subtree: _.hash(htmlSubtree, {"!cdata": cdata}),

    aliases: domAlias,
}

export const XHTMLRenderer = {
    print: _.identity,

    check(node, voids) {
        const isVoid = voids.indexOf(node.tag) >= 0
        return {
            void: isVoid,
            type: !isVoid | 2, /* 2: is XML */
        }
    },

    aliases: domAlias,

    subtree: _.hash(htmlSubtree, {"!CDATA": cdata}),
}

// Exported for testing.
export const types = _.hash({
    html: {
        voids: htmlVoids,
        renderer: HTMLRenderer,
    },

    "html-polyglot": {
        voids: htmlVoids,
        renderer: XHTMLRenderer,
    },

    html4: {
        voids: legacyVoids,
        renderer: HTMLRenderer,
    },

    xhtml: {
        voids: legacyVoids,
        renderer: XHTMLRenderer,
    },

    xml: {
        voids: [],
        renderer: XMLRenderer,
    },
})

export const DefaultRenderer = {
    print: _.identity,

    check() {
        return xmlStaticCheck
    },

    subtree: _.hash(),
    aliases: _.hash(),
}

const defaultType = {
    voids: [],
    renderer: DefaultRenderer,
}

export default function getType(type) {
    if (type == null) return defaultType
    assert(typeof type, "string")
    if (!(type in types)) throw new Error("Unknown document type")
    return types[type]
}
