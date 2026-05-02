import BigNumber from 'bignumber.js'
import { NumericModel, type NumericModelEvent, type NumericModelOptions } from 'toad.js/appkit/NumericModel'
import { evaluate } from './details/expression'
import type { Unit } from './units/Unit'

// function bind(_target: any, context: ClassMemberDecoratorContext) {
//     const methodName = context.name
//     if (context.private) {
//         throw Error(`@bind cannot decorate private properties like ${methodName.toString()}`)
//     }
//     context.addInitializer(function() {
//         (this as any)[methodName] = (this as any)[methodName].bind(this)
//     })
// }

export type BigNumberModelEvent = NumericModelEvent
export type BigNumberModelOptions = NumericModelOptions<BigNumber>

export class BigNumberModel extends NumericModel<BigNumber> {
    constructor(n: number, options?: BigNumberModelOptions)
    constructor(n: string, options?: BigNumberModelOptions)
    constructor(n: string, base?: number, options?: BigNumberModelOptions)
    constructor(n: BigNumber, options?: BigNumberModelOptions)
    constructor(n: number | string | BigNumber, baseOrOptions?: number | BigNumberModelOptions, options?: BigNumberModelOptions) {
        if (n instanceof BigNumber) {
            super(n)
        } else
            if (typeof n === "string" && typeof baseOrOptions !== "number") {
                super(BigNumber(n), baseOrOptions)
            } else
                if (typeof n === "string" && typeof baseOrOptions === "number") {
                    super(BigNumber(n, baseOrOptions), options)
                } else
                    if (typeof n === "number" && typeof baseOrOptions !== "number") {
                        super(BigNumber(n), baseOrOptions)
                    } else {
                        throw Error(`BigNumberModel called with invalid arguments`)
                    }
    }

    // @bind
    increment() {
        if (this.step !== undefined) {
            this.value = this.clip(this.value.plus(this.step))
        }
    }

    // @bind
    decrement() {
        if (this.step !== undefined) {
            this.value = this.clip(this.value.minus(this.step))
        }
    }

    get unit(): Unit | undefined {
        return undefined
    }

    override set value(value: BigNumber | number | string) {
        let number: BigNumber
        if (value instanceof BigNumber) {
            number = value
        } else
            if (typeof value === "string") {
                number = evaluate(value, this.unit)!
            } else {
                number = BigNumber(value)
            }
        // let number = typeof value === "string" ? parseFloat(value) : value
        this.signal.withLock(() => {
            if (this.autocorrect) {
                super.value = this.clip(number)
            } else {
                super.value = number
                this.error = this.check(number)
            }
        })
    }
    override get value(): BigNumber {
        return super.value
    }

    protected clip(value: BigNumber) {
        if (this.min !== undefined && value.comparedTo(this.min)! < 0) {
            value = BigNumber(this.min)
        }
        if (this.max !== undefined && value.comparedTo(this.max)! > 0) {
            value = BigNumber(this.max)
        }
        return value
    }

    protected check(value: BigNumber) {
        if (this.min !== undefined && value.comparedTo(this.min)! < 0) {
            return `The value must not be below ${this.min}.`
        }
        if (this.max !== undefined && value.comparedTo(this.max)! > 0) {
            if (this.autocorrect) {
                value = BigNumber(this.max)
            } else {
                return `The value must not be above ${this.max}.`
            }
        }
        return undefined
    }
}