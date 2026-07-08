import { vec3, mat4 } from "gl-matrix"
import type { Context } from "src/gl/Context"
import type { Mesh } from "./Mesh"
import type { XForm } from "./XForm"

export class IndyNode {
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
