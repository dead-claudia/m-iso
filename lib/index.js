"use strict"

var _ = require("./util.js")

var m = module.exports = require("./constructor.js")
m.render = require("./render.js")
_.assign(m, require("./deferred.js"))
m.route = _.assign({}, require("./query.js"))
