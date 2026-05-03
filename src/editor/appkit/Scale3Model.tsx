import { TripleModel } from "../appkit/TripleModel"
import { FactorModel } from "../appkit/units/FactorModel"

export class Scale3Model extends TripleModel {
    readonly x = new FactorModel(0, { label: "X", step: 0.01 });
    readonly y = new FactorModel(0, { label: "Y", step: 0.01 });
    readonly z = new FactorModel(0, { label: "Z", step: 0.01 });
    constructor() {
        super()
        this.init()
    }
}
