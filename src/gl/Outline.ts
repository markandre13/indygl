import type { Texture } from "./buffers/Texture"
import type { Context } from "./Context"
import { ShaderOutline } from "./shaders/ShaderOutline"

class Overlay {

}

class Outline extends Overlay {
    context: Context
    shader: ShaderOutline
    texture?: GPUTexture
    bindGroup!: GPUBindGroup
    constructor(context: Context) {
        super()
        this.context = context
        this.shader = new ShaderOutline(context)
    }

    render() {
        const context = this.context
        const device = context.device.device
        const canvas = context.canvas

        // init texture and bindGroup
        if (this.texture === undefined
            || this.texture.width !== canvas.width
            || this.texture.height !== canvas.height
        ) {
            this.texture?.destroy()
            this.texture = device.createTexture({
                format: 'rgba8unorm',
                size: [canvas.width, canvas.height, 1],
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            })
            // read from texture
            this.bindGroup = device.createBindGroup({
                layout: this.shader.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: this.texture },
                ],
            })
        }

        const postProcessRenderPassDescriptor: GPURenderPassDescriptor = {
            label: 'post process render pass',
            colorAttachments: [
                {
                    view: this.texture.createView(),
                    loadOp: 'load',
                    storeOp: 'store'
                },
            ],
        }

        // Draw outline based on alpha of postTexture
        // on to the canvasTexture
        // postProcess(encoder, undefined, canvasTexture);

        //        const commandBuffer = encoder.finish();
        // device.queue.submit([commandBuffer]);
    }
}