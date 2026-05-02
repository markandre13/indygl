import { Length } from "./Length"
import type { Unit } from "./Unit"
import { UnitModel } from "./UnitModel"

export class LengthModel extends UnitModel {
    override get symbol(): string {
        return Length.symbol
    }
    override get unit(): Unit | undefined {
        return Length
    }
}