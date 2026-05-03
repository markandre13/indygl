import { Signal } from "toad.js/reactive/Signal"
import type { UnitModel } from "../appkit/units/UnitModel"

// https://docs.blender.org/manual/en/latest/scene_layout/object/editing/transform/control/numeric_input.html
// number, unit
// rename Signal into Emitter to avoid name clash with tc39 signals?
export abstract class TripleModel {
    signal = new Signal;
    abstract x: UnitModel
    abstract y: UnitModel
    abstract z: UnitModel
    private emit() { this.signal.emit() }
    protected init() {
        this.emit = this.emit.bind(this)
        this.x.signal.add(this.emit)
        this.y.signal.add(this.emit)
        this.z.signal.add(this.emit)
    }
}
