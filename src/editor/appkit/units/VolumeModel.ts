import { type Unit, makeUnit } from "./Unit"
import { UnitModel } from "./UnitModel"

export const VolumeUnit: Unit = makeUnit([
    // metric area units
    ["pm³", Math.pow(0.000000000001, 3),],
    ["pm3", Math.pow(0.000000000001, 3)],
    ["nm³", Math.pow(0.000000001, 3)],
    ["nm3", Math.pow(0.000000001, 3)],
    ["um³", Math.pow(0.000001, 3)],
    ["um3", Math.pow(0.000001, 3)],
    ["mm³", Math.pow(0.001, 3)],
    ["mm3", Math.pow(0.001, 3)],
    ["cm³", Math.pow(0.01, 3)],
    ["cm3", Math.pow(0.01, 3)],
    ["dm³", Math.pow(0.1, 3)],
    ["dm3", Math.pow(0.1, 3)],
    ["m³", 1],
    ["m3", 1],
    ["dam³", Math.pow(10, 3)],
    ["dam3", Math.pow(10, 3)],
    ["hm³", Math.pow(100, 3)],
    ["hm3", Math.pow(100, 3)],
    ["km³", Math.pow(1000, 3)],
    ["km3", Math.pow(1000, 3)],
    // imperial area units
    // TODO: blender actually uses "cu mil", but identifiers with spaces aren't handled by the lexer yet
    ["mil³", Math.pow(0.0000254, 3)],
    ["mil3", Math.pow(0.0000254, 3)],
    ["in³", Math.pow(0.0254, 3)],
    ["in3", Math.pow(0.0254, 3)],
    ['"³', Math.pow(0.0254, 3)],
    ['"3', Math.pow(0.0254, 3)],
    ["ft³", Math.pow(0.3048, 3)],
    ["ft3", Math.pow(0.3048, 3)],
    ["'³", Math.pow(0.3048, 3)],
    ["'3", Math.pow(0.3048, 3)],
    ["yd³", Math.pow(0.9144, 3)],
    ["yd3", Math.pow(0.9144, 3)],
    ["ch³", Math.pow(20.1168, 3)],
    ["ch3", Math.pow(20.1168, 3)],
    ["fur³", Math.pow(201.168, 3)],
    ["fur3", Math.pow(201.168, 3)],
    ["mi³", Math.pow(1609.344, 3)],
    ["mi3", Math.pow(1609.344, 3)],
    // ["m",0.9144],
])

export class VolumeModel extends UnitModel {
    override get unit(): Unit { return VolumeUnit }
}