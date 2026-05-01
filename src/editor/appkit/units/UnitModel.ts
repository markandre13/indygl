import { BigNumberModel } from "../BigNumberModel"

export abstract class UnitModel extends BigNumberModel {
    abstract get symbol(): string
}