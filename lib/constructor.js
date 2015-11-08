"use strict"

var _ = require("./util.js")

var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[.+?\])/g
var attrParser = /\[(.+?)(?:=("|'|)(.*?)\2)?\]/

function checkForAttrs(pairs) {
    return pairs != null &&
        _.isObject(pairs) &&
        !("tag" in pairs || "view" in pairs || "subtree" in pairs)
}

function parseSelector(tag, cell) {
    var classes = []
    var match
    while ((match = parser.exec(tag)) != null) {
        if (match[1] === "" && match[2]) {
            cell.tag = match[2]
        } else if (match[1] === "#") {
            cell.attrs.id = match[2]
        } else if (match[1] === ".") {
            classes.push(match[2])
        } else if (match[3][0] === "[") {
            var pair = attrParser.exec(match[3])
            cell.attrs[pair[1]] = pair[3] || (pair[2] ? "" : true)
        }
    }

    return classes
}

function getChildrenFromList(hasAttrs, args) {
    var children = hasAttrs ? args.slice(1) : args
    if (children.length === 1 && Array.isArray(children[0])) {
        return children[0]
    } else {
        return children
    }
}

function assignAttrs(cell, attrs, classAttr, classes) {
    for (var attr in attrs) if (_.hasOwn(attrs, attr)) {
        var value = attrs[attr]
        if (attr === classAttr && value != null && value !== "") {
            classes.push(value)

            // create key in correct iteration order
            cell.attrs[attr] = ""
        } else {
            cell.attrs[attr] = value
        }
    }

    if (classes.length) {
        cell.attrs[classAttr] = classes.join(" ")
    }
}

module.exports = m
function m(tag, pairs) {
    for (var args = [], i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i]
    }

    if (_.isObject(tag)) return parameterize(tag, args)
    var hasAttrs = checkForAttrs(pairs)
    var attrs = hasAttrs ? pairs : {}
    var classAttr = "class" in attrs ? "class" : "className"
    var cell = {tag: "div", attrs: {}}

    if (!_.isString(tag)) {
        throw new Error("selector in m(selector, attrs, children) should " +
            "be a string")
    }

    var classes = parseSelector(tag, cell)
    cell.children = getChildrenFromList(hasAttrs, args)

    assignAttrs(cell, attrs, classAttr, classes)

    return cell
}

m.r = function (tag, pairs) {
    for (var args = [], i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i]
    }

    if (_.isObject(tag)) return parameterize(tag, args)

    if (!_.isString(tag)) {
        throw new Error("selector in m(selector, attrs, children) should " +
            "be a string")
    }

    var hasAttrs = checkForAttrs(pairs)

    return {
        tag: tag,
        attrs: _.assign({}, hasAttrs ? pairs : {}),
        children: getChildrenFromList(hasAttrs, args)
    }
}

function parameterize(component, args) {
    var originalCtrl = _.d(component.controller, _.noop)
    var originalView = _.d(component.view, _.noop)

    function Ctrl() {
        return originalCtrl.apply(this, args) || this
    }

    if (originalCtrl !== _.noop) {
        Ctrl.prototype = originalCtrl.prototype
    }

    function view(ctrl) {
        var rest = [ctrl].concat(args)
        for (var i = 1; i < arguments.length; i++) {
            rest.push(arguments[i])
        }

        return originalView.apply(component, rest)
    }

    view.$original = originalView
    var output = {controller: Ctrl, view: view}

    if (args[0] && args[0].key != null) {
        output.attrs = {key: args[0].key}
    }

    return output
}

m.component = function (component) {
    var args = []
    for (var i = 1; i < arguments.length; i++) {
        args.push(arguments[i])
    }

    return parameterize(component, args)
}

m.trust = function (value) {
    value = new String(value) // eslint-disable-line no-new-wrappers
    value.$trusted = true
    return value
}
