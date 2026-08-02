import { OptionModel } from "toad.js/appkit/OptionModel"
import type { OptionModelOptions } from "toad.js/appkit/OptionModelBase"
import { PropertyTab } from "./PropertyTab"

export class PropertyTabModel extends OptionModel<PropertyTab> {
    constructor(value: PropertyTab, options?: OptionModelOptions<PropertyTab>) {
        super(value, [
            [PropertyTab.OBJECT, 0],
            [PropertyTab.DATA, 1],
            [PropertyTab.VERTEX_GROUPS, 2],
            [PropertyTab.SHAPE_KEY, 3],
            [PropertyTab.MATERIAL, 4],
        ], options)
    }
}
