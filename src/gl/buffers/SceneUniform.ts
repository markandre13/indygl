import { mat4 } from "gl-matrix"
import { Uniform } from "./Uniform"
import type { Context } from "../Context"

// TODO: multiply projection and camera before it hits the GPU
//       to only have one multiplication
export class SceneUniform extends Uniform {
    bindGroup: GPUBindGroup
    constructor(context: Context) {
        super(context.device.device, ["mat4x4f", "mat4x4f"])
        this.bindGroup = context.device.device.createBindGroup({
            label: 'camera-bind-group',
            layout: context.bindGroupLayout.scene,
            entries: [
                { binding: 0, resource: this.buffer },
            ],
        })
    }
    perspective(fovy: number, aspect: number, near: number, far: number) {
        mat4.perspectiveZO(this.values[0], fovy, aspect, near, far)
    }
    get camera(): mat4 {
        return this.values[1]
    }
}
