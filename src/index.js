import m, * as mithril from "./constructor.js"
export default m
m.r = mithril.r
m.component = mithril.component
m.trust = mithril.trust

import {render, renderNode} from "./render/index.js"
m.render = render
m.render.node = renderNode

import {deferred, prop, sync} from "./deferred.js"
m.deferred = deferred
m.prop = prop
m.sync = sync

import {buildQueryString, parseQueryString} from "./query.js"
m.route = {}
m.route.buildQueryString = buildQueryString
m.route.parseQueryString = parseQueryString
