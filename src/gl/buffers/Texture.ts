
export class Texture {
    texture?: GPUTexture
    async load(device: GPUDevice, filename: string) {
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
            { source: imageBitmap },
            { texture: this.texture },
            [imageBitmap.width, imageBitmap.height]
        )
    }
}
