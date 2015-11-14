import * as _ from "../util.js"
import * as renderer from "./renderer.js"

export function isNonNode(attrs) {
    return attrs == null || !_.isObject(attrs) ||
        attrs.tag == null && attrs.view == null && attrs.subtree == null
}

function isComponent(pairs) {
    return _.isObject(pairs) && pairs.view != null
}

export function resolveComponents(node) {
    // Flatten out components that render to other components/nodes.
    while (isComponent(node)) {
        node = node.view(node.controller != null ? new node.controller() : {})
    }

    return node
}

export function escape(string) {
    if (string == null) return ""
    if (string.$trusted) return renderer.trust(string.valueOf())

    if (typeof string === "symbol") {
        return String(string)
    } else {
        return `${string}`
    }
}
