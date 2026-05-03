import { vec3 } from "gl-matrix"
import { TripleModel } from "./TripleModel"
import { RotationModel } from "./units/RotationModel"
import { deg2rad } from "src/gl/algorithms/deg2rad"

export class Rot3Model extends TripleModel {
    readonly x = new RotationModel(0, { label: "X", step: 1 });
    readonly y = new RotationModel(0, { label: "Y", step: 1 });
    readonly z = new RotationModel(0, { label: "Z", step: 1 });
    constructor() {
        super()
        this.init()
    }
    override get value(): vec3 {
        vec3.set(this.v, deg2rad(this.x.toNumber()), deg2rad(this.y.toNumber()), deg2rad(this.z.toNumber()))
        return this.v
    }
}
