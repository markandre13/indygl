import { TripleModel } from "./TripleModel"
import { LengthModel } from "./units/LengthModel"

export class Vec3Model extends TripleModel {
    readonly x = new LengthModel(0, { label: "X", step: 0.01 })
    readonly y = new LengthModel(0, { label: "Y", step: 0.01 })
    readonly z = new LengthModel(0, { label: "Z", step: 0.01 })
    constructor() {
        super()
        this.init()
    }
}
