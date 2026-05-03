import { type Unit, makeUnit } from "./Unit"
import { UnitModel } from "./UnitModel"

export const AccelerationUnit: Unit = makeUnit([
    ["m/s²", 1],
    ["m/s2", 1],
    ["ft/s²", 0.3048],
    ["ft/s2", 0.3048],
])

export class AccelerationModel extends UnitModel {
    override get unit(): Unit { return AccelerationUnit }
}