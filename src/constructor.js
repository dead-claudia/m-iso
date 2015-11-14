import * as _ from "./util.js"

const parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
const attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/

function checkForAttrs(pairs) {
    return pairs != null &&
        _.isObject(pairs) &&
        !("tag" in pairs || "view" in pairs || "subtree" in pairs)
}

function parseSelector(tag, cell) {
    const classes = []
    let match
    while ((match = parser.exec(tag)) != null) {
        if (match[1] === "" && match[2]) {
            cell.tag = match[2]
        } else if (match[1] === "#") {
            cell.attrs.id = match[2]
        } else if (match[1] === ".") {
            classes.push(match[2])
        } else if (match[3][0] === "[") {
            const pair = attrParser.exec(match[3])
            cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true)
        }
    }

    return classes
}

function getChildrenFromList(hasAttrs, args) {
    const children = hasAttrs ? args.slice(1) : args
    if (children.length === 1 && Array.isArray(children[0])) {
        return children[0]
    } else {
        return children
    }
}

function assignAttrs(cellAttrs, attrs, classAttr, classes) {
    _.forOwn(attrs, (value, attr) => {
        if (attr === classAttr && value != null && value !== "") {
            // Flatten them here so they can be properly joined later.
            _.flatPush(classes, value)

            // create key in correct iteration order
            cellAttrs[attr] = ""
        } else {
            cellAttrs[attr] = value
        }
    })

    if (classes.length) {
        cellAttrs[classAttr] = classes.join(" ")
    }
}

export default function m(tag, ...args) {
    if (_.isObject(tag)) return parameterize(tag, args)

    const pairs = args[0]
    const hasAttrs = checkForAttrs(pairs)
    const attrs = hasAttrs ? pairs : {}
    const classAttr = "class" in attrs ? "class" : "className"
    const cell = {tag: "div", attrs: {}}

    if (!_.isString(tag)) {
        throw new Error("selector in m(selector, attrs, children) should " +
            "be a string")
    }

    const classes = parseSelector(tag, cell)
    cell.children = getChildrenFromList(hasAttrs, args)

    assignAttrs(cell.attrs, attrs, classAttr, classes)

    return cell
}

export function r(tag, ...args) {
    if (_.isObject(tag)) return parameterize(tag, args)

    if (!_.isString(tag)) {
        throw new Error("selector in m(selector, attrs, children) should " +
            "be a string")
    }

    const pairs = args[0]
    const hasAttrs = checkForAttrs(pairs)

    return {
        tag,
        attrs: _.assign({}, hasAttrs ? pairs : {}),
        children: getChildrenFromList(hasAttrs, args),
    }
}

function parameterize(component, args) {
    let Ctrl = _.noop

    if (component.controller != null) {
        const {controller} = component

        Ctrl = function Ctrl() {
            return controller.apply(this, args) || this
        }

        Ctrl.prototype = controller.prototype
    }

    let retView = _.noop

    if (component.view != null) {
        const {view} = component

        retView = function (ctrl) {
            const rest = [ctrl].concat(args)
            for (let i = 1; i < arguments.length; i++) {
                rest.push(arguments[i])
            }

            return view.apply(component, rest)
        }

        retView.$original = view
    } else {
        retView.$original = _.noop
    }

    const output = {controller: Ctrl, view: retView}

    if (args[0] && args[0].key != null) {
        output.attrs = {key: args[0].key}
    }

    return output
}

export function component(component, ...args) {
    return parameterize(component, args)
}

export function trust(value) {
    value = new String(value) // eslint-disable-line no-new-wrappers
    value.$trusted = true
    return value
}
