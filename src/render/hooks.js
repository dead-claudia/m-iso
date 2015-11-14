import {hasOwn, identity} from "../util.js"

const defaults = {
    print: identity,
}

export default class Wrapper {
    constructor(hooks) {
        this.hooks = hooks
    }

    get(name) {
        return hasOwn(this.hooks, name) ? this.hooks[name] : defaults[name]
    }
}
