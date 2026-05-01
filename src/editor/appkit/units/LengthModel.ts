import { Length } from "./Length"
import { UnitModel } from "./UnitModel"

class LengthModel extends UnitModel {
    override get symbol(): string {
        return Length.symbol
    }
}