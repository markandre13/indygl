import { ColorUniform } from "../gl/buffers/ColorUniform"
import { Texture } from "../gl/buffers/Texture"
import type { Context } from "../gl/Context"


export class Material {
    bindGroup: GPUBindGroup

    constructor(context: Context, rgba: number[])
    constructor(context: Context, texture: Texture)
    constructor(context: Context, rgbaOrTexture: number[] | Texture) {
        const device = context.device
        if (rgbaOrTexture instanceof Texture) {
            this.texture = rgbaOrTexture
            this.bindGroup = device.device.createBindGroup({
                label: 'material-bind-group',
                layout: context.bindGroupLayout.materialTexture,
                entries: [
                    { binding: 0, resource: context.sampler },
                    { binding: 1, resource: rgbaOrTexture.texture!.createView() },
                ],
            })
        } else {
            this.colorUniform = new ColorUniform(device)
            this.colorUniform.rgba = rgbaOrTexture
            this.colorUniform.writeTo(device)

            this.bindGroup = device.device.createBindGroup({
                label: 'material-bind-group',
                layout: context.bindGroupLayout.materialRGBA,
                entries: [
                    { binding: 0, resource: this.colorUniform.buffer },
                ],
            })
        }
    }
    colorUniform?: ColorUniform
    texture?: Texture
}
