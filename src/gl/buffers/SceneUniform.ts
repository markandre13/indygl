import { mat4, vec3, vec4 } from "gl-matrix"
import { Uniform } from "./Uniform"
import type { Context } from "../Context"
import type { Device } from "../Device"

// TODO: multiply projection and camera before it hits the GPU
//       to only have one multiplication
export class SceneUniform extends Uniform {
    private _perspective = mat4.create()
    private _camera = mat4.create()
    private _dirty = false
    bindGroup: GPUBindGroup
    constructor(context: Context) {
        super(context.device.device, ["mat4x4f", "vec4f"])
        this.bindGroup = context.device.device.createBindGroup({
            label: 'camera-bind-group',
            layout: context.bindGroupLayout.scene,
            entries: [
                { binding: 0, resource: this.buffer },
            ],
        })
    }
    get projectionMatrix(): mat4 {
        return this.values[0]
    }
    setPerspective(fovy: number, aspect: number, near: number, far: number) {
        this._dirty = true
        mat4.perspectiveZO(this._perspective, fovy, aspect, near, far)
    }
    get perspective(): mat4 {
        return this._perspective
    }
    get camera(): mat4 {
        this._dirty = true
        return this._camera
    }
    override writeTo(device: Device): void {
        if (this._dirty) {
            const camMat = mat4.invert(mat4.create(), this._camera)
            if (camMat === null) {
                throw Error(`failed to invert this._camera=${mat4.str(this._camera)}`)
            }
            mat4.mul(this.values[0], this._perspective, this._camera)

            const p = vec4.fromValues(0, 0, 0, 1)
            vec4.transformMat4(this.values[1], p, camMat)
            // mat4.getTranslation(this.values[1], this._camera)
            // console.log(`camera at: ${vec3.str(this.values[1])}`)
            this._dirty = false
        }
        super.writeTo(device)
    }
}
