import BigNumber from 'bignumber.js'
import { NumericModel, type NumericModelEvent, type NumericModelOptions } from 'toad.js/appkit/NumericModel'

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
}