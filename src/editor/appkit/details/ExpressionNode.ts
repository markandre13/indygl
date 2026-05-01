// import { SpreadsheetModel } from "../../table/model/SpreadsheetModel"

import BigNumber from "bignumber.js"

export class ExpressionNode {
    // string: one of the tokens
    // number: fixed number
    // number[]: col, row
    // undefined: error?
    value: string | BigNumber | undefined
    down?: ExpressionNode
    next?: ExpressionNode
    constructor(value: string | BigNumber | undefined) {
        this.value = value
    }
    eval(): BigNumber {
        // console.log(`eval %o`, this)
        if (this.value instanceof BigNumber) {
            // console.log(`node.value = ${this.value.toNumber()}`)
            return this.value
        }
        switch (this.value) {
            case '+':
                return this.down!.eval().plus(this.down!.next!.eval())
            case '-':
                if (this.down?.next) {
                    return this.down!.eval().minus(this.down!.next!.eval())
                }
                return this.down!.eval().negated()
            case '*':
                return this.down!.eval().times(this.down!.next!.eval())
            case '/':
                return this.down!.eval().div(this.down!.next!.eval())
            default:
                throw Error(`unexpected token '${this.value}'`)
        }
    }
    append(node: ExpressionNode) {
        if (this.down === undefined) {
            this.down = node
        } else {
            let n = this.down
            while (n.next) {
                n = n.next
            }
            n.next = node
        }
    }
    // dependencies(deps: Array<Array<number>> = []) {
    //     if (this.value instanceof Array) {
    //         deps.push(this.value)
    //     }
    //     if (this.next) {
    //         this.next.dependencies(deps)
    //     }
    //     if (this.down) {
    //         this.down.dependencies(deps)
    //     }
    //     return deps
    // }
    toString() {
        return this._toString()
    }
    protected _toString(out: string = "\n", indent: number = 0) {
        for (let i = 0; i < indent; ++i) {
            out += "    "
        }
        out += this.value
        out += "\n"
        for (let n = this.down; n; n = n.next) {
            out = n._toString(out, indent + 1)
        }
        return out
    }
}
