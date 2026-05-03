import BigNumber from "bignumber.js"
import { makeUnit, type Unit } from "./Unit"
import { UnitModel } from "./UnitModel"

export const RotationUnit: Unit = makeUnit([
    ["°", 1],                    // degree
    ["d", 1],
    ["'", 60 * 180 / Math.PI],   // arcminute
    ['"', 3600 * 180 / Math.PI], // arcsecond
    ["r", 180 / Math.PI],        // radian
    ["rad", 180 / Math.PI],
    ["t", Math.PI * 2.0],        // turn
    ["turn", Math.PI * 2.0],
])

export class RotationModel extends UnitModel {
    override get unit(): Unit { return RotationUnit }
    override clip(value: BigNumber) {
        while (value.comparedTo(0)! < 0) { 
            value = value.plus(360)
        }
        while (value.comparedTo(360)! >= 0) { 
            value = value.minus(360)
        }
        return super.clip(value)
    }
}
