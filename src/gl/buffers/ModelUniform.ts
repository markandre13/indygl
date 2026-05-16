import type { mat4 } from "gl-matrix"
import { Uniform } from "./Uniform"
import type { Context } from "../Context"

/**
 * contains the model's model-view and normal matrix
 */
export class ModelUniform extends Uniform {
    bindGroup: GPUBindGroup
    constructor(context: Context) {
        const device = context.device
        super(device.device!!, ["mat4x4f", "mat4x4f"])
        this.bindGroup = device.device.createBindGroup({
            label: 'model-bind-group',
            layout: context.bindGroupLayout.model,
            entries: [
                { binding: 0, resource: this.buffer },
            ],
        })
    }
    get modelViewMatrix(): mat4 {
        return this.values[0]
    }
    get normalMatrix(): mat4 {
        return this.values[1]
    }
}
