import { TripleModel } from "../appkit/TripleModel"
import { RotationModel } from "../appkit/units/RotationModel"

export class Rot3Model extends TripleModel {
    readonly x = new RotationModel(0, { label: "X", step: 1 });
    readonly y = new RotationModel(0, { label: "Y", step: 1 });
    readonly z = new RotationModel(0, { label: "Z", step: 1 });
    constructor() {
        super()
        this.init()
    }
}
