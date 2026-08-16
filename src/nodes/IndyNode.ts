import { vec3, mat4 } from "gl-matrix"
import type { Context } from "src/gl/Context"
import type { Mesh } from "./Mesh"
import { XForm } from "./XForm"
import { PropertyTab } from "src/editor/app/PropertyTab"
import { Signal } from "toad.js/reactive/Signal"
// import type { Root } from "./Root"

export const NODE_INSERT = Symbol("NODE_INSERT")
export const NODE_REMOVE = Symbol("NODE_REMOVE")
export const NODE_CHANGE = Symbol("NODE_CHANGE")

export type NodeInsertEvent = { type: typeof NODE_INSERT; node: IndyNode }
export type NodeRemoveEvent = { type: typeof NODE_REMOVE; node: IndyNode }
export type NodeChangeEvent = { type: typeof NODE_CHANGE; node: IndyNode }
export type NodeEvent = NodeInsertEvent | NodeRemoveEvent | NodeChangeEvent

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

    get show(): boolean | undefined { return undefined }
    set show(value: boolean | undefined) { throw Error(`show can not be set for ${this.constructor.name}`) }
    get showEnabled(): boolean | undefined {
        for (let p = this.parent; p; p = p.parent) {
            if (p.show === false) {
                return false
            }
        }
        return true
    }
    constructor(parent: IndyNode) {
        if (parent) {
            this.parent = parent
            this.root = parent.root
            this.context = parent.context
            parent.children.push(this)
            this.root.signal.emit({ type: NODE_INSERT, node: this })
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
            return this as any
        }
        if (this.parent) {
            return this.parent.getXForm()
        }
        return undefined
    }
    context!: Context
    parent?: IndyNode
    root!: Root
    children: IndyNode[] = [];
    // runtime
    readonly combined = mat4.create();
    dirty = true;
}

export class Root extends IndyNode {
    signal = new Signal<NodeEvent>()
    static override uiHints: NodeUiHints = {
        color: "#6387d2",
        icon: "icons.svg#blender-collection",
        propertyTab: PropertyTab.OBJECT
    }
    override get name(): string { return this.constructor.name }
    override get uihints(): NodeUiHints { return Root.uiHints }

    constructor(context: Context) {
        super(undefined as any)
        this.root = this
        this.context = context
    }
}