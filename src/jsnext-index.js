import m, {r, component, trust} from "./constructor.js"
export default m
export {r, component, trust}

import {render, renderNode} from "./render/index.js"
render.node = renderNode
export {render}
export {deferred, prop, sync} from "./deferred.js"

import {buildQueryString, parseQueryString} from "./query.js"
export const route = {}
route.buildQueryString = buildQueryString
route.parseQueryString = parseQueryString
