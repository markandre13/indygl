import { mat4, vec3 } from "gl-matrix"
import { IndyNode, type NodeUiHints } from "./IndyNode"
import { PropertyTab } from "src/editor/app/PropertyTab"

export class XForm extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#bd7f4d",
        icon: "icons.svg#blender-outliner-obj-data",
        propertyTab: PropertyTab.OBJECT
    }
    override get name(): string { return this.objectName ?? this.constructor.name }
    override get uihints(): NodeUiHints { return IndyNode.uiHints }

    transform?: mat4
    objectName?: string

    override get origin(): vec3 | undefined {
        const origin = vec3.create()
        mat4.getTranslation(origin, this.combined)
        return origin
    }
}
