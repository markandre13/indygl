import { type Unit, makeUnit } from "./Unit"
import { UnitModel } from "./UnitModel"

export const TimeUnit: Unit = makeUnit([
    ["d", 3600], // days
    ["day", 3600],
    ["days", 3600],
    ["h", 3600], // hours
    ["hr", 3600],
    ["hour", 3600],
    ["hours", 3600],
    ["m", 60], // minutes
    ["min", 60],
    ["s", 1], // seconds
    ["sec", 1],
    ["ms", 0.001], // milliseconds
    ["µs", 0.000001], // microseconds
    ["us", 0.000001],
    ["ns", 0.000000001] // nanoseconds
])

export class TimeModel extends UnitModel {
    override get unit(): Unit { return TimeUnit }
}