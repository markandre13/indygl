import type { Context } from "../Context"

export class Texture {
    texture?: GPUTexture
    
    async load(context: Context, filename: string) {
        const device = context.device.device

        const response = await fetch(filename)
        if (response.ok == false) {
            throw Error(`cube texture: fetch failed`)
        }
        const imageBitmap = await createImageBitmap(await response.blob())

        this.texture = device.createTexture({
            size: [imageBitmap.width, imageBitmap.height, 1],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        })
        device.queue.copyExternalImageToTexture(
            { source: imageBitmap, flipY: true },
            { texture: this.texture },
            [imageBitmap.width, imageBitmap.height]
        )
    }
}
