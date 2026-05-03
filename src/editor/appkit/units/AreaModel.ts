import { type Unit, makeUnit } from "./Unit"
import { UnitModel } from "./UnitModel"

export const AreaUnit: Unit = makeUnit([
    // metric area units
    ["pm²", Math.pow(0.000000000001, 2),],
    ["pm2", Math.pow(0.000000000001, 2)],
    ["nm²", Math.pow(0.000000001, 2)],
    ["nm2", Math.pow(0.000000001, 2)],
    ["um²", Math.pow(0.000001, 2)],
    ["um2", Math.pow(0.000001, 2)],
    ["mm²", Math.pow(0.001, 2)],
    ["mm2", Math.pow(0.001, 2)],
    ["cm²", Math.pow(0.01, 2)],
    ["cm2", Math.pow(0.01, 2)],
    ["dm²", Math.pow(0.1, 2)],
    ["dm2", Math.pow(0.1, 2)],
    ["m²", 1],
    ["m2", 1],
    ["dam²", Math.pow(10, 2)],
    ["dam2", Math.pow(10, 2)],
    ["hm²", Math.pow(100, 2)],
    ["hm2", Math.pow(100, 2)],
    ["km²", Math.pow(1000, 2)],
    ["km2", Math.pow(1000, 2)],
    // imperial area units
    // TODO: blender actually uses "sq mil", but identifiers with spaces aren't handled by the lexer yet
    ["mil²", Math.pow(0.0000254, 2)],
    ["mil2", Math.pow(0.0000254, 2)],
    ["in²", Math.pow(0.0254, 2)],
    ["in2", Math.pow(0.0254, 2)],
    ['"²', Math.pow(0.0254, 2)],
    ['"2', Math.pow(0.0254, 2)],
    ["ft²", Math.pow(0.3048, 2)],
    ["ft2", Math.pow(0.3048, 2)],
    ["'²", Math.pow(0.3048, 2)],
    ["'2", Math.pow(0.3048, 2)],
    ["yd²", Math.pow(0.9144, 2)],
    ["yd2", Math.pow(0.9144, 2)],
    ["ch²", Math.pow(20.1168, 2)],
    ["ch2", Math.pow(20.1168, 2)],
    ["fur²", Math.pow(201.168, 2)],
    ["fur2", Math.pow(201.168, 2)],
    ["mi²", Math.pow(1609.344, 2)],
    ["mi2", Math.pow(1609.344, 2)],
    // ["m",0.9144],
])

export class AreaModel extends UnitModel {
    override get unit(): Unit { return AreaUnit }
}