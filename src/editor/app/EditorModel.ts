import { OptionModel } from "toad.js/appkit/OptionModel"
import { SelectionMode } from "./SelectionMode"
import { ViewportShading } from "./ViewportShading"
import { TransformModel } from "../appkit/TransformModel"
import { TransformOrientation } from "./TransformOrientation"
import { NumberModel } from "toad.js/appkit/NumberModel"
import { PropertyTab } from "./PropertyTab"
import { PropertyTabModel } from "./PropertyTabModel"

export class EditorModel {
    //
    // for the controls in the toolbar
    //
    readonly selectionMode = new OptionModel(
        SelectionMode.POINT, [
        [SelectionMode.OBJECT, 1],
        [SelectionMode.POINT, 2],
        [SelectionMode.EDGE, 3],
        [SelectionMode.FACE, 4],
    ], { local: "selection-mode" })

    readonly viewportShading = new OptionModel(
        ViewportShading.WIREFRAME_XRAY, [
        [ViewportShading.WIREFRAME_XRAY, 0],
        [ViewportShading.WIREFRAME, 1],
        [ViewportShading.SOLID_XRAY, 2],
        [ViewportShading.SOLID, 3],
        [ViewportShading.MATERIAL_PREVIEW, 4]
    ], { local: "viewport-shading" })

    readonly transformOrientation = new OptionModel(
        TransformOrientation.GLOBAL, [
        [TransformOrientation.GLOBAL, 0],
        [TransformOrientation.LOCAL, 1],
    ], { local: "transform-orientation" })

    //
    // for the controls in the property panel
    //
    readonly propertyTab = new PropertyTabModel(PropertyTab.OBJECT, { local: "transform-orientation" })

    readonly transform = new TransformModel()

    //
    // experimental stuff
    //
    readonly morph = new NumberModel(0, { min: 0, max: 1, step: 0.01 })
}