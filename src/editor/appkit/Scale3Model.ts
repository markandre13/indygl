import { TripleModel } from "./TripleModel"
import { FactorModel } from "./units/FactorModel"

export class Scale3Model extends TripleModel {
    readonly x = new FactorModel(1, { label: "X", step: 0.01 });
    readonly y = new FactorModel(1, { label: "Y", step: 0.01 });
    readonly z = new FactorModel(1, { label: "Z", step: 0.01 });
    constructor() {
        super()
        this.init()
    }
}
