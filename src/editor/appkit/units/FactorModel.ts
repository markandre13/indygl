import { makeUnit, type Unit } from "./Unit"
import { UnitModel } from "./UnitModel"

export const FactorUnit: Unit = makeUnit([
    ["", 1],
    ["%", 0.01]
])

export class FactorModel extends UnitModel {
    override get unit(): Unit { return FactorUnit }
}
