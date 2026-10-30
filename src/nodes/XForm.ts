import { mat4, vec3 } from "gl-matrix"
import { IndyNode, NODE_CHANGE, type Node2Name, type NodeUiHints } from "./IndyNode"
import { PropertyTab } from "src/editor/app/PropertyTab"

export class XForm extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#bd7f4d",
        icon: "icons.svg#blender-outliner-obj-data",
        propertyTab: PropertyTab.OBJECT
    }
    override get name(): string { return this.objectName ?? this.constructor.name }
    override set name(name: string) { this.objectName = name }

    override get uihints(): NodeUiHints { return IndyNode.uiHints }

    override get show(): boolean | undefined {
        return this._show
    }
    override set show(value: boolean | undefined) {
        if (value === undefined) {
            throw Error(`show can not be set to undefined for ${this.constructor.name}`)
        }
        this._show = value
        this.root.signal.emit({ type: NODE_CHANGE, node: this })
        XForm.showChange(this)
    }
    static showChange(node: IndyNode) {
        for (const child of node.children) {
            if (child.show !== undefined) {
                node.root.signal.emit({ type: NODE_CHANGE, node: child })
            }
            XForm.showChange(child)
        }
    }

    constructor(parent: IndyNode, objectName?: string) {
        super(parent)
        this.objectName = objectName
    }

    override persist(data: any, _: Node2Name) {
        if (this.objectName) {
            data.name = this.objectName
        }
        if (this.transform) {
            data.transform = Array.from(this.transform)
        }
    }
    override restore(data: any): void {
        this.objectName = data.name
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

    private _show = true
    transform?: mat4
    objectName?: string

    override get origin(): vec3 | undefined {
        const origin = vec3.create()
        mat4.getTranslation(origin, this.combined)
        return origin
    }
}
