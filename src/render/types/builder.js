import assert from "assert"

import * as _ from "../../util.js"
import * as common from "../common.js"
import * as renderer from "../renderer.js"
const {n} = renderer

class Subtree {
    constructor(hooks) {
        this.hooks = hooks
    }

    render(renderer, node, arg) {
        /* eslint-disable no-use-before-define */
        return new Builder(renderer, arg, this.hooks).render(node)
        /* eslint-enable no-use-before-define */
    }

    str(item) {
        return renderer.trust(item)
    }
}

function renderAttrs(object, aliases) {
    const attrs = []

    _.forOwn(object, (value, key) => {
        // This is a future-proofing extension to avoid potential breakage.
        if (typeof value === "function") {
            throw new TypeError("Function values are currently reserved")
        }

        // If an alias references another, follow it. If it's ends up null,
        // break before assigning it as the key.
        while (key in aliases) {
            key = aliases[key]
        }

        // Protect against Symbols by explicitly calling toString()
        attrs.push([key, value.toString()])
    })

    return attrs
}

class Renderer {
    constructor(builder) {
        if (process.env.NODE_ENV === "development") {
            assert(typeof builder, "object")
            assert(builder != null)
            assert(typeof builder.renderer, "object")
            assert(builder.renderer != null)
        }

        this.builder = builder
        this.renderer = builder.renderer
        this.children = []
    }

    add(node) {
        this.children.push(node)
        return node
    }

    render(node) {
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                this.render(node[i])
            }
            return this.children
        }

        const {builder} = this

        if (common.isNonNode(node)) {
            return this.add(common.escape(builder.hooks.get("print")(node)))
        }

        const {renderer} = this
        const name = renderer.print(node.tag)
        const subtree = renderer.subtree

        if (name in subtree) {
            return this.add(subtree[name].call(new Subtree(builder.hooks), node,
                builder.arg, renderer))
        }

        const attrs = renderAttrs(node.attrs, renderer.aliases)
        const data = renderer.check(node, builder.arg)

        if (!data.void) {
            for (let i = 0; i < node.children.length; i++) {
                this.children.push(builder.render(node.children[i]))
            }
        }

        return n(data.type, name, attrs, this.children)
    }
}

export default class Builder {
    constructor(renderer, arg, hooks) {
        if (process.env.NODE_ENV === "development") {
            assert.equal(typeof renderer, "object")
            assert(renderer != null)
            assert(arg != null)
            assert.equal(typeof hooks, "object")
            assert(hooks != null)
        }

        this.renderer = renderer
        this.arg = arg
        this.hooks = hooks
    }

    render(node) {
        return new Renderer(this).render(common.resolveComponents(node))
    }
}
