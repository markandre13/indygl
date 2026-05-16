import { mat4 } from "gl-matrix"
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
        super(context.device.device, ["mat4x4f"])
        this.bindGroup = context.device.device.createBindGroup({
            label: 'camera-bind-group',
            layout: context.bindGroupLayout.scene,
            entries: [
                { binding: 0, resource: this.buffer },
            ],
        })
    }
    perspective(fovy: number, aspect: number, near: number, far: number) {
        this._dirty = true
        mat4.perspectiveZO(this._perspective, fovy, aspect, near, far)
    }
    get camera(): mat4 {
        this._dirty = true
        return this._camera
    }
    override writeTo(device: Device): void {
        if (this._dirty) {
            mat4.mul(this.values[0], this._perspective, this._camera)
            this._dirty = false
        }
        super.writeTo(device)
    }
}
