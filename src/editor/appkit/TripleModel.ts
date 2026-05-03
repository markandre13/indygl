import { Signal } from "toad.js/reactive/Signal"
import type { UnitModel } from "./units/UnitModel"
import { vec3 } from "gl-matrix"

// https://docs.blender.org/manual/en/latest/scene_layout/object/editing/transform/control/numeric_input.html
// number, unit
// rename Signal into Emitter to avoid name clash with tc39 signals?
export abstract class TripleModel {
    signal = new Signal;
    abstract x: UnitModel
    abstract y: UnitModel
    abstract z: UnitModel
    protected readonly v = vec3.create()
    private emit() { this.signal.emit() }
    protected init() {
        this.emit = this.emit.bind(this)
        this.x.signal.add(this.emit)
        this.y.signal.add(this.emit)
        this.z.signal.add(this.emit)
    }
    get value(): vec3 {
        vec3.set(this.v, this.x.toNumber(), this.y.toNumber(), this.z.toNumber())
        return this.v
    }
}
