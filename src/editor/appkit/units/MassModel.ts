import { type Unit, makeUnit } from "./Unit"
import { UnitModel } from "./UnitModel"

export const MassUnit: Unit = makeUnit([
    // metric mass units
    ["t", 1000], // tonne
    ["ql", 100], // quintal
    ["kg", 1], // kilogram
    ["hg", 0.1], // hectogram
    ["dag", 0.01], // dekagram
    ["g", 0.001], // gram
    ["mg", 0.000001], // milligram

    // imperial mass units
    ["tn", 907.18474], // ton
    ["cwt", 45.359237], // centum weight
    ["st", 6.35029318], // stone
    ["lb", 0.45359237], // pound
    ["oz", 0.028349523125], // ounce
])

export class AccelerationModel extends UnitModel {
    override get unit(): Unit { return MassUnit }
}