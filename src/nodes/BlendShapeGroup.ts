import { PropertyTab } from 'src/editor/app/PropertyTab'
import { IndyNode, type Node2Name, type NodeUiHints } from './IndyNode'
import { mat4 } from 'gl-matrix'

export class BlendShapeGroup extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#6387d2",
        icon: "icons.svg#blender-shapekey-data",
        propertyTab: PropertyTab.SHAPE_KEY
    }
    override get name(): string { return this.constructor.name }
    override get uihints(): NodeUiHints { return BlendShapeGroup.uiHints }

    transform?: mat4

    override persist(data: any, _: Node2Name) {
        if (this.transform) {
            data.transform = Array.from(this.transform)
        }
    }
    override restore(data: any): void {
        if (data.transform) {
            const t = data.transform as number[]
            this.transform = mat4.fromValues(
                t[0], t[1], t[2], t[3],
                t[4], t[5], t[6], t[7],
                t[8], t[9], t[10], t[11],
                t[12], t[13], t[14], t[15]
            )
        }
    }
}
