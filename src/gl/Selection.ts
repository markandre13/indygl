import { mat4, vec3 } from 'gl-matrix'
import type { EditorModel } from 'src/editor/app/EditorModel'
import { bind } from 'src/editor/appkit/details/decorators/bind'
import type { IndyNode } from 'src/nodes/IndyNode'
import type { XForm } from 'src/nodes/XForm'
import { deg2rad } from './algorithms/deg2rad'
import { euler2matrix, matrix2euler } from './algorithms/euler'
import { rad2deg } from './algorithms/rad2deg'

export class Selection {
    model: EditorModel
    active?: IndyNode
    selected = new Set<IndyNode>();

    constructor(model: EditorModel) {
        this.model = model
        model.transform.signal.add(this.transformActive)
    }

    /**
     * clear selection
     */
    clear() {
        this.active = undefined
        this.selected.clear()
    }

    /**
     * add node to selection and make it the active node
     *
     * @param node
     */
    add(node: IndyNode) {
        // TODO: edit the active node via the panel
        // HOW : make 'active' private, then everybody has to operate through the selection
        //       which keeps everything updated. the way the IndyNode does not have to become
        //       a 
        this.active = node
        this.selected.add(node)
        this.update()
    }

    /**
     * update the active
     */
    @bind
    transformActive() {
        if (!this.active) {
            return
        }
        const m = mat4.create()
        mat4.translate(m, m, this.model.transform.translation.value)
        mat4.mul(m, m, euler2matrix(
            deg2rad(this.model.transform.rotation.x.value.toNumber()),
            deg2rad(this.model.transform.rotation.y.value.toNumber()),
            deg2rad(this.model.transform.rotation.z.value.toNumber())
        ))
        const parent = this.active.parent as XForm
        parent.transform = m
        parent.dirty = true
    }

    /**
     * update EditorModel.transform
     *
     * @returns
     */
    update() {
        if (!this.active) {
            return
        }
        const node = this.active
        const parent = node.parent as XForm
        if (!parent.transform) {
            parent.transform = mat4.create()
        }
        const m = mat4.clone(parent.transform)!
        const pos = vec3.create() // extract the position
        vec3.transformMat4(pos, pos, m)
        this.model.transform.translation.value = pos
        const e = matrix2euler(m)
        this.model.transform.rotation.x.value = rad2deg(e.x)
        this.model.transform.rotation.y.value = rad2deg(e.y)
        this.model.transform.rotation.z.value = rad2deg(e.z)
    }
}
