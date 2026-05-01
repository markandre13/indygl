// import { SpreadsheetModel } from "../../table/model/SpreadsheetModel"

import BigNumber from "bignumber.js"
import type { Unit } from "../units/Unit"

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
    eval(unit?: Unit): BigNumber {
        // console.log(`eval %o`, this)
        // console.log(this.down)
        if (this.value instanceof BigNumber) {
            // console.log(`node.value = ${this.value.toNumber()}`)
            if (this.down && this.down.value) {
                if (unit === undefined) {
                    throw Error(`unexpected unit '${this.down.value}'`)
                }
                const symbol = this.down.value as string
                const scale = unit?.symbol2scale.get(symbol)
                if (scale === undefined) {
                    throw Error(`unknown unit '${this.down.value}', expected on of ${Array.of(unit?.symbol2scale.keys()).join(", ")}`)
                }
                return this.value.times(scale)
            }
            return this.value
        }
        switch (this.value) {
            case '+':
                return this.down!.eval(unit).plus(this.down!.next!.eval(unit))
            case '-':
                if (this.down?.next) {
                    return this.down!.eval(unit).minus(this.down!.next!.eval())
                }
                return this.down!.eval(unit).negated()
            case '*':
                return this.down!.eval(unit).times(this.down!.next!.eval(unit))
            case '/':
                return this.down!.eval(unit).div(this.down!.next!.eval(unit))
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
