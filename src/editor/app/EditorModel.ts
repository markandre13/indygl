import { OptionModel } from "toad.js/appkit/OptionModel"
import { SelectionMode } from "./SelectionMode"
import { ViewportShading } from "./ViewportShading"

export class EditorModel {
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
        [ViewportShading.TEXTURED, 4]
    ], { local: "viewport-shading" })
}