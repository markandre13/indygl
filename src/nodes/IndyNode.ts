import { vec3, mat4 } from "gl-matrix"
import type { Context } from "src/gl/Context"
import type { Mesh } from "./Mesh"
import type { XForm } from "./XForm"
import { PropertyTab } from "src/editor/app/PropertyTab"

/**
 * hints on how to handle this node type in the UI
 */
export interface NodeUiHints {
    /**
     * which color to use for this node in the outliner
     */
    color: string
    /**
     * which icon to use for this node in the outliner
     */
    icon: string
    /**
     * which property tab to open when this node is selected
     */
    propertyTab: PropertyTab
}

export class IndyNode {
    // note: here Smalltalk has an advantage because there
    // what defined here as static is a class too.
    static uiHints: NodeUiHints = {
        color: "#bd7f4d",
        icon: "icons.svg#blender-outliner-obj-data",
        propertyTab: PropertyTab.OBJECT
    }
    /**
     * which name to display in the outliner
     */
    get name(): string { return this.constructor.name }
    get uihints(): NodeUiHints { return IndyNode.uiHints }

    constructor(parent: IndyNode) {
        if (parent) {
            this.parent = parent
            this.context = parent.context
            parent.children.push(this)
        }
    }

    get origin(): vec3 | undefined {
        return undefined
    }
    // TODO: make this getMeshes to give the nodes more control?
    //       this.context could provide further data
    getMesh(): Mesh | undefined {
        for (const child of this.children) {
            if (child.constructor.name === "Mesh") {
                return child as Mesh
            }
            const mesh = child.getMesh()
            if (mesh) {
                return mesh
            }
        }
        return undefined
    }
    /**
     * 
     * 
     * @returns 
     */
    getXForm(): XForm | undefined {
        if (this.constructor.name === "XForm") {
            return this
        }
        if (this.parent) {
            return this.parent.getXForm()
        }
        return undefined
    }
    context!: Context
    parent?: IndyNode
    children: IndyNode[] = [];
    // runtime
    readonly combined = mat4.create();
    dirty = true;
}
