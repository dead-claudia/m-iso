import matches from "lodash.matches"

// Note: the multimethod implementation and code generation simplified this a
// *lot*.

// This is thrown whenever the expression cannot be statically reduced
export const sentinel = new Error("unreducible")

function check(cond) {
    if (!cond) throw sentinel
}

function multi() {
    const fs = []
    function ret(...args) {
        for (const f of fs) {
            if (f.match(args)) return f.call(...args)
        }
        check(false)
    }
    ret.method = (args, call) => fs.push({match: matches(args), call})
    return ret
}

const binary = multi()
const unary = multi()

/* eslint-disable no-new-func */
"===,!==,==,!=,>,>=,<,<=,<<,>>,>>>,+,-,*,/,%,|,^,&,||,&&".split(",")
.forEach(op => binary.method([op], new Function("_, a, b", `return a ${op} b`)))

"-,+,!,~,typeof".split(",")
.forEach(op => unary.method([op], new Function("_, a", `return ${op} a`)))
/* eslint-enable no-new-func */

export const reduce = multi()

function n(type, args) {
    if (args == null) return {type}
    return Object.assign({type}, args)
}

reduce.method([n("Literal")], ({value}) => value)

function binaryReduce(n) {
    return binary(n.operator, reduce(n.left), reduce(n.right))
}

reduce.method([n("LogicalExpression")], binaryReduce)
reduce.method([n("BinaryExpression")], binaryReduce)

reduce.method([n("UnaryExpression")], n =>
    unary(n.operator, reduce(n.argument)))

reduce.method([n("AssignmentExpression", {operator: "="})],
    n => reduce(n.right))
