import { SceneUniform } from './buffers/SceneUniform'
import type { Device } from './Device'

export class CanvasContext {
    device: Device
    canvas: HTMLCanvasElement
    context: GPUCanvasContext | null = null;
    presentationFormat: GPUTextureFormat
    depthTextureFormat: GPUTextureFormat = 'depth24plus';
    private depthTexture?: GPUTexture
    private depthTextureView?: GPUTextureView
    sampler: GPUSampler
    sceneUniforms: SceneUniform

    constructor(device: Device, canvas: HTMLCanvasElement) {
        this.device = device
        this.canvas = canvas
        this.context = canvas.getContext('webgpu')
        if (this.context == null) {
            throw Error('no webgpu')
        }

        this.sceneUniforms = new SceneUniform(device)

        const devicePixelRatio = window.devicePixelRatio
        const pixelWidth = canvas.clientWidth * devicePixelRatio
        const pixelHeight = canvas.clientHeight * devicePixelRatio
        this.adjustSizeCore(pixelWidth, pixelHeight)

        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat()
        this.context.configure({
            device: device.device!!,
            format: this.presentationFormat,
        })

        // Create a sampler with linear filtering for smooth interpolation of textures
        this.sampler = device.device!.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        })

        const observer = new ResizeObserver(_entries => {
            this.ajustSize()
        })
        observer.observe(canvas)
    }

    getCanvasView() {
        return this.context!
            .getCurrentTexture() // get canvas as texture
            .createView() // map it into WebGPU
    }

    getDepthTextureView(): GPUTextureView {
        if (this.depthTexture === undefined || this.depthTextureView === undefined) {
            this.depthTexture = this.device.device!.createTexture({
                size: [this.canvas.width, this.canvas.height],
                format: this.depthTextureFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT,
            })
            if (this.depthTexture === undefined) {
                throw Error(`failed to create depth texture`)
            }
            this.depthTextureView = this.depthTexture.createView()
            if (this.depthTextureView === undefined) {
                throw Error(`failed to create depth texture view`)
            }
        }
        return this.depthTextureView!
    }

    ajustSize() {
        const devicePixelRatio = window.devicePixelRatio
        const pixelWidth = this.canvas.clientWidth * devicePixelRatio
        const pixelHeight = this.canvas.clientHeight * devicePixelRatio
        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.adjustSizeCore(pixelWidth, pixelHeight)
        }
    }

    adjustSizeCore(pixelWidth: number, pixelHeight: number) {
        console.log(`adjust canvas size: canvas.width=${this.canvas.width}, pixelWidth=${pixelWidth}; canvas.height=${this.canvas.height}, pixelHeight=${pixelHeight}`)
        this.canvas.width = pixelWidth
        this.canvas.height = pixelHeight

        this.depthTexture = undefined

        const fieldOfView = (45 * Math.PI) / 180 // in radians
        const aspect = pixelWidth / pixelHeight
        const zNear = 0.1
        const zFar = 100.0
        this.sceneUniforms.perspective(fieldOfView, aspect, zNear, zFar)
        this.sceneUniforms.writeTo(this.device.device!.queue)
    }
}
