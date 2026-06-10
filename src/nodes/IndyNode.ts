import { vec3, mat4 } from "gl-matrix"
import type { Context } from "src/gl/Context"


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
    context!: Context
    parent?: IndyNode
    children: IndyNode[] = [];
    // runtime
    readonly combined = mat4.create();
    dirty = true;
}
