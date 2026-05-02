import { type Unit, makeUnit } from "./Unit"


export const Velocity: Unit = makeUnit([
    // metric velocity units
    ["m/s", 1],
    ["km/h", 1000 / 3600],
    // imperial velocity units
    ["ft/s", 0.3048],
    ["mph", 1609.344 / 3600],
])
