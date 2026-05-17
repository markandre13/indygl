import { ColorUniform } from "../gl/buffers/ColorUniform"
import type { Texture } from "../gl/buffers/Texture"
import type { Context } from "../gl/Context"


export class Material {
    bindGroup: GPUBindGroup

    constructor(context: Context, rgba: number[]) {
        const device = context.device
        this.colorUniform = new ColorUniform(device)
        this.colorUniform.rgba = rgba
        this.colorUniform.writeTo(device)

        this.bindGroup = device.device.createBindGroup({
            label: 'material-bind-group',
            layout: context.bindGroupLayout.material,
            entries: [
                { binding: 0, resource: this.colorUniform.buffer },
            ],
        })
    }
    colorUniform: ColorUniform
    // rgba: number[]
    texture?: Texture
}
