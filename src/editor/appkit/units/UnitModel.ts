import { BigNumberModel } from "../BigNumberModel"
import type { Unit } from "./Unit"

export abstract class UnitModel extends BigNumberModel {
    get symbol(): string { return this.unit.symbol }
    abstract override get unit(): Unit
}