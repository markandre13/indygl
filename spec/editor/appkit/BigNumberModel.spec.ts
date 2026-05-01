import { BigNumberModel } from "../../../src/editor/appkit/BigNumberModel"
import BigNumber from "bignumber.js"
import { describe, expect, it } from "vitest"

describe("BigNumberModel", () => {
    describe("constructor", () => {
        it('BigNumberModel(n: BigNumber)', () => {
            const a = new BigNumberModel(BigNumber(16))
            expect(a.value.toNumber()).equals(16)
        })
        it("BigNumberModel(n: number)", () => {
            const a = new BigNumberModel(0.1)
            expect(a.value.toNumber()).equals(0.1)
        })
        it('BigNumberModel(n: string)', () => {
            const a = new BigNumberModel("0.1")
            expect(a.value.toNumber()).equals(0.1)
        })
        it('BigNumberModel(n: string, base: number)', () => {
            const a = new BigNumberModel("10", 16)
            expect(a.value.toNumber()).equals(16)
        })
    })
})