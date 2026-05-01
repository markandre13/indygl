import { makeUnit, type Unit } from "./Unit"

export const Length: Unit = makeUnit([
    // metric length units
    ["nm", 0.000000001],// nanometer
    ["um", 0.000001],   // micrometer
    ["mm", 0.001],      // millimeter
    ["cm", 0.01],       // centimeter
    ["dm", 0.1],        // decimeter
    ["m", 1],           // meter
    ["dam", 10],        // dekameter
    ["hm", 100],        // hectometer
    ["km", 1000],       // kilometer
    // imperial length units
    ["mil", 0.0000254], // thou
    ["in", 0.0254],     // inch
    ['"', 0.0254],      // inch
    ["ft", 0.3048],     // foot, feet
    ["'", 0.3048],      // foot, feet
    ["yd", 0.9144],     // yard
    ["ch", 20.1168],    // chain
    ["fur", 201.168],   // furlong
    ["mi", 1609.344],   // mile
    // ["m",0.9144],      // mile
])