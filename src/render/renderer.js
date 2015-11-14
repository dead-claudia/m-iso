import assert from "assert"

// XML and HTML both require the same characters to be escaped.
const escapeChars = {
    '"': "&quot;",
    "<": "&lt;",
    "&": "&amp;",
}

function escapeReplacer(name) {
    return escapeChars[name]
}

function escapeStr(string, isAttr) {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof string, "string")
    }

    return string.replace(isAttr ? /["<&]/g : /[<&]/g, escapeReplacer)
}

/**
 * Format:
 *
 * Numbers 0-3:
 * First bit: Invert void handling (i.e. HTML void elements, require end tag in
 * 			  XML).
 * Second bit: Render as XML.
 *
 * 4: Trust this.
 * 5: This is a program.
 */

export const types = Object.freeze({
    html: 0,
    htmlVoid: 1,
    xml: 2,
    xmlEnd: 3,
    trust: 4,
    root: 5,
})

/**
 * Build an internal node.
 *
 * type: the type of this element, in the format above
 *
 * name: the name of this element
 * attrs: the attributes, as a list of pairs.
 * children: the children of this element, which are assumed to be flattened.
 */
export function n(type, name, attrs, children) {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof type, "number")
        assert.equal(typeof name, "string")
        assert(Array.isArray(attrs))
        assert(Array.isArray(children))
    }

    return {type: type|0, name, attrs, children}
}

/**
 * Build an internal trusted node carrying a string. The string is assumed to be
 * a primitive.
 */
export function trust(string) {
    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof string, "string")
    }

    return {
        type: 4, // 4 === trusted
        value: string.concat(), // flatten the string
    }
}

/**
 * Build an internal body node, only for the top level
 */
export function root(children) {
    if (process.env.NODE_ENV === "development") {
        assert(Array.isArray(children))
    }

    // 5 === root
    return {type: 5, children}
}

function attrs(attrs) {
    let str = ""
    for (let i = 0; i < attrs.length; i++) {
        const attr = attrs[i]
        assert(typeof attr, "string")
        str += ` ${attr[0]}="${escapeStr(attr[1], true)}"`
    }
    return str
}

function body(children) {
    let str = ""
    for (let i = 0; i < children.length; i++) {
        str += render(children[i])
    }
    return str
}

// To detect and manage duplicates as fast as possible. Closures are avoided for
// speed.
const renderCache = (() => {
    // Sets are always faster than any other way. Adding, testing, and deleting
    // is O(1)
    if (typeof Set === "function") {
        return {
            _set: new Set(),

            test(item) {
                const set = this._set
                if (set.has(item)) {
                    set.delete(item)
                    return true
                } else {
                    set.add(item)
                    return false
                }
            },

            remove(item) {
                this._set.delete(item)
            },
        }
    } else {
        return {
            _list: [],
            _len: 0,

            // This should always be called on the same level as remove
            test(item) {
                const list = this._list
                let i = this._len

                if (list[i] === item) {
                    list.pop()
                    return true
                }

                while (i !== 0) {
                    i--
                    if (item === list[i]) {
                        list.splice(i, 1)
                        return true
                    }
                }

                list.push(item)
                this._len++
                return false
            },

            // This should always be called on the same level as test
            remove() {
                this._len--
                this._list.pop()
            },
        }
    }
})()

/**
 * Render a node tree to a string. Assumptions made on the input:
 *
 * - Each node is either a primitive string or one of the types above
 * - The node's types are exactly to spec.
 * - The node tree is not circular.
 */
export function render(node) {
    if (typeof node === "string") return escapeStr(node, false)

    if (process.env.NODE_ENV === "development") {
        assert.equal(typeof node, "object")
    }

    if (renderCache.test(node)) {
        throw new TypeError("Tree must not be circular")
    }

    const type = node.type|0

    if (type === 4) return node.value
    if (type === 5) return body(node.children)

    const name = node.name
    let str = `<${name}${attrs(node.attrs)}`

    if (type === 1 /* void HTML */) return `${str}>`

    const children = node.children

    /* no force close, is XML */
    if (children.length === 0 && type === 2) return `${str}/>`
    str += `>${body(children)}`

    renderCache.remove(node)

    return `${str}</${name}>`
}
