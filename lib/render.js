"use strict"

var _ = require("./util.js")

// XML and HTML both require the same characters to be escaped.
var escapeChars = {
    '"': "&quot;",
    "<": "&lt;",
    "&": "&amp;"
}

function escapeReplacer(name) {
    return escapeChars[name]
}

function substitute(isAttr, string) {
    return string.toString()
        .replace(isAttr ? /["<&]/g : /[<&]/g, escapeReplacer)
}

function escape(string, isAttr) {
    if (string == null) return ""
    if (string.$trusted) return string.valueOf()

    if (_.isFunction(string)) {
        return "return " + substitute(isAttr, string) + ".call(this)"
    } else {
        return substitute(isAttr, string)
    }
}

function renderAttrs(object, aliases) {
    var ret = ""
    for (var key in object) if (_.hasOwn(object, key)) {
        var value = object[key]
        ret += " " + _.d(aliases[key], key) + '="' + escape(value, true) + '"'
    }
    return ret
}

function isComponent(pairs) {
    return _.isObject(pairs) && pairs.view != null
}

function resolveComponents(node) {
    // Flatten out components that render to other components/nodes.
    while (isComponent(node)) {
        node = node.view(node.controller != null ? new node.controller() : {})
    }

    return node
}

var XMLSyntax = {
    voidEnd: "/>",
    doClose: function (node) {
        return node.children.length === 0
    }
}

function isNonNode(attrs) {
    return attrs == null || !_.isObject(attrs) ||
        attrs.tag == null && attrs.view == null && attrs.subtree == null
}

var Base = {
    print: _.identity,
    render: function (node, arg) {
        node = resolveComponents(node)

        var str, i

        if (Array.isArray(node)) {
            str = ""
            for (i = 0; i < node.length; i++) {
                str += this.render(node[i], arg)
            }
            return str
        }

        if (isNonNode(node)) return escape(node, false)

        var tag = this.print(node.tag)

        if (this.subtree[tag] != null) {
            return this.subtree[tag].call(this, node, arg)
        }

        str = "<" + tag + renderAttrs(node.attrs, this.aliases)

        if (this.doClose(node, arg)) return str + this.voidEnd

        str += ">"

        for (i = 0; i < node.children.length; i++) {
            str += this.render(node.children[i], arg)
        }

        return str + "</" + tag + ">"
    },

    doClose: function (node, voids) {
        return voids.indexOf(node.tag) >= 0
    },

    subtree: {},
    aliases: {
        className: "class"
    }
}

var SVGRenderer = _.assign({}, Base, XMLSyntax, {
    subtree: {
        foreignObject: function (node, opts) {
            return opts.parent.render(node, opts.voids)
        }
    }
})

function cdataText(child) {
    if (child == null) {
        return ""
    } else if (Array.isArray(child)) {
        var str = ""
        for (var i = 0; i < child.length; i++) {
            str += cdataText(child[i])
        }
        return str
    } else {
        return child.toString()
    }
}

function cdata(node) {
    return "<![CDATA[" + cdataText(node.children) + "]]>"
}

var XMLRenderer = _.assign({}, Base, XMLSyntax, {
    aliases: {},
    subtree: {"!CDATA": cdata}
})

var legacyVoids = [
    "area", "base", "basefont", "br", "col", "frame", "hr", "img", "input",
    "isindex", "link", "meta", "param"
]

var htmlVoids = [
    "area", "base", "br", "col", "embed", "hr", "img", "input", "keygen",
    "link", "menuitem", "meta", "param", "source", "track", "wbr"
]

var HTMLRenderer = _.assign({}, Base, {
    voidEnd: ">",
    print: function (tag) { return tag.toLowerCase() },
    subtree: {
        "!cdata": cdata,
        svg: function (node, voids) {
            return SVGRenderer.render(node, {parent: this, voids: voids})
        },
        math: function (node) {
            return XMLRenderer.render(node, [])
        }
    }
})

var XHTMLRenderer = _.assign({}, HTMLRenderer, XMLSyntax, {
    print: _.identity,
    doClose: HTMLRenderer.doClose, // Keep better compatibility
    subtree: _.assign({}, HTMLRenderer.subtree, {
        // Use the capitalized CDATA version
        "!CDATA": cdata,
        "!cdata": null
    })
})

function getVoids(type) {
    if (type == null) return []
    switch (type) {
    case "html":
    case "html-polygot":
        return htmlVoids

    case "html4":
    case "xhtml":
        return legacyVoids

    case "xml":
        return []

    default:
        throw new Error("Unknown document type")
    }
}

function getRenderer(type) {
    switch (type) {
    case "html":
    case "html4":
        return HTMLRenderer

    case "html-polygot":
    case "xhtml":
        return XHTMLRenderer

    case "xml":
        return XMLRenderer

    default:
        throw new Error("Unknown document type")
    }
}

function getXmlCross(type) {
    switch (type) {
    case "html": return "html-polygot"
    case "html4": return "xhtml"
    default: return type
    }
}

function isXml(type) {
    return type === "html-polygot" || type === "xhtml"
}

function BaseRenderer(type, voids) {
    this.type = type
    this.voids = voids
    this.hasVoids = voids != null
    this.next = "start"
}

BaseRenderer.prototype.setVoids = function () {
    if (!this.hasVoids) {
        this.voids = getVoids(this.type)
    }
}

BaseRenderer.prototype.set = function (type) {
    if (this.type == null) {
        this.type = type
    } else if (this.type === "xml") {
        this.type = getXmlCross(type)
    } else if (type === "xml") {
        this.type = getXmlCross(this.type)
    } else {
        this.type = isXml(this.type) ? getXmlCross(type) : type
    }
}

BaseRenderer.prototype.renderDoctype = function (children) {
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

    var child = children[0]

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
        return '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" ' +
            '"http://www.w3.org/TR/html4/frameset.dtd">'

    default:
        throw new Error("Bad doctype name: " + child)
    }
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

BaseRenderer.prototype.renderXmlDeclaration = function (attrs) {
    if (this.next === "body") {
        throw new Error("Cannot introduce declarations in body")
    } else if (this.next === "doctype") {
        throw new Error("Declaration must come before doctype")
    }
    this.next = "body"

    this.set("xml")

    var encoding = "utf-8"

    if (attrs.encoding != null) encoding = attrs.encoding.toLowerCase()

    var version = parseVersion(attrs.version)

    if (version !== "1.0" && version !== "1.1") {
        throw new Error("Bad version number: " + version)
    }

    var str = "<?xml version='" + version + "' encoding='" + encoding + "'"

    var standalone = attrs.standalone

    if (standalone != null) {
        if (typeof attrs.standalone === "boolean") {
            standalone = standalone ? "yes" : "no"
        } else if (standalone !== "yes" && standalone !== "no") {
            throw new Error("Invalid value for `standalone` attribute: " +
                             JSON.stringify(standalone))
        }
        str += " standalone='" + standalone + "'"
    }

    return str + "?>"
}

BaseRenderer.prototype.renderBase = function (node) {
    node = resolveComponents(node)
    if (isNonNode(node)) {
        return escape(node)
    } else if (node.tag.toLowerCase() === "!doctype") {
        return this.renderDoctype(node.children)
    } else if (node.tag === "?xml") {
        return this.renderXmlDeclaration(node.attrs)
    } else {
        if (this.type == null) this.type = "html"
        this.setVoids()
        this.next = "body"
        return getRenderer(this.type).render(node, this.voids)
    }
}

BaseRenderer.prototype.render = function (nodes) {
    if (Array.isArray(nodes)) {
        var str = ""
        for (var i = 0; i < nodes.length; i++) {
            str += this.render(nodes[i])
        }
        return str.concat()
    } else {
        return this.renderBase(nodes).concat()
    }
}

module.exports = function (tree, type, voids) {
    if (type != null && typeof type !== "string") {
        throw new Error("Expected `type` to be a string or not exist")
    }

    if (voids != null && !Array.isArray(voids)) {
        throw new Error("Expected `voids` to be an array or not exist")
    }

    return new BaseRenderer(type, voids).render(tree)
}
