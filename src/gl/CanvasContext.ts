import { mat4 } from 'gl-matrix'
import { SceneUniform } from './buffers/SceneUniform'
import type { Device } from './Device'
import { deg2rad } from './algorithms/deg2rad'
import { euler2matrix } from './algorithms/euler'
import type { Controller } from './controllers/Controller'

export enum Projection {
    ORTHOGONAL,
    PERSPECTIVE
}

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
    renderPassDescriptor: GPURenderPassDescriptor

    private _controllerStack: Controller[] = []

    pushController(controller: Controller) {
        this._controllerStack.push(controller)
        this.invalidate()
        console.log(controller.info())
    }
    popController() {
        this._controllerStack.pop()
        this.invalidate()
    }

    constructor(device: Device, canvas: HTMLCanvasElement) {
        this.device = device
        this.canvas = canvas

        this.setupEventHandling(canvas)

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

        this.renderPassDescriptor = {
            colorAttachments: [
                {
                    view: undefined as any, // assigned later
                    clearValue: this.backgroundColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: undefined as any, // assigned later
                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',
            },
        }

        const observer = new ResizeObserver(_entries => {
            this.ajustSize()
            this.invalidate()
        })
        observer.observe(canvas)
    }

    // paint?: () => void
    backgroundColor = [0.247, 0.247, 0.247, 1.0]
    camera = mat4.create()
    private _invalidated = false
    invalidate() {
        if (this._invalidated) {
            return
        }
        this._invalidated = true
        requestAnimationFrame(() => {
            if (this.doPaint) {
                this.doPaint()
            }
        })
    }
    paint?: () => void
    protected doPaint() {
        // console.log(`Controller.doPaint()`)
        // we clear _invalidated here so that the following paint()'s may invalidate the view again
        this._invalidated = false

        if (this.paint) {
            this.paint()
        }
        // console.log(`this._controllerStack.length = ${this._controllerStack.length }`)
        for (let i = this._controllerStack.length - 1; i >= 0; --i) {
            this._controllerStack[i]!.paint()
        }
    }

    resetCamera() {
        // const defaultCamera = this._context.defaultCamera
        // if (defaultCamera) {
        mat4.identity(this.camera)
        mat4.translate(this.camera, this.camera, [0.0, 0.0, -6.0])
        this.invalidate()
        //     mat4.copy(this._context.camera, defaultCamera)
        //     this._context.invalidate()
        // }
    }
    rotateCameraTo(x: number, y: number, z: number) {
        const justTranslation = mat4.clone(this.camera)
        // just rotation
        justTranslation[12] = justTranslation[13] = justTranslation[14] = 0
        // inverse rotation
        mat4.invert(justTranslation, justTranslation)
        // just translation
        mat4.mul(justTranslation, justTranslation, this.camera)

        const newRotation = euler2matrix(deg2rad(x), deg2rad(y), deg2rad(z))

        this.camera = mat4.mul(newRotation, newRotation, justTranslation)
    }

    protected _projection: Projection = Projection.PERSPECTIVE
    set projection(value: Projection) {
        this._projection = value
        this.invalidate()
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

    getRenderPassDescriptor() {
        // set render destination
        this.renderPassDescriptor.colorAttachments[0]!.view = this.getCanvasView()
        this.renderPassDescriptor.depthStencilAttachment!.view = this.getDepthTextureView()
        return this.renderPassDescriptor
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
        this.sceneUniforms.writeTo(this.device)
    }

    /**
     * setup handling of pointer, keyboard and resize event
     */
    private setupEventHandling(canvas: HTMLCanvasElement) {

        //
        // resize
        //
        // new ResizeObserver(this.paint).observe(canvas)

        //
        // pointer
        //
        let downX = 0, downY = 0, buttonDown = false
        canvas.oncontextmenu = (ev: MouseEvent) => {
            ev.preventDefault()
        }
        canvas.onpointerdown = (ev: PointerEvent) => {
            for (let i = this._controllerStack.length - 1; i >= 0; --i) {
                this._controllerStack[i]!.pointerdown(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()


            canvas.setPointerCapture(ev.pointerId)
            buttonDown = true
            downX = ev.x
            downY = ev.y
        }
        canvas.onpointerup = (ev: PointerEvent) => {
            for (let i = this._controllerStack.length - 1; i >= 0; --i) {
                this._controllerStack[i]!.pointerup(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()
            buttonDown = false
        }
        canvas.onpointermove = (ev: PointerEvent) => {
            for (let i = this._controllerStack.length - 1; i >= 0; --i) {
                this._controllerStack[i]!.pointermove(ev)
                if (ev.defaultPrevented) {
                    return
                }
            }
            ev.preventDefault()
        }

        //
        // keyboard
        //
        window.onkeyup = (ev: KeyboardEvent) => {
            for (let i = this._controllerStack.length - 1; i >= 0; --i) {
                this._controllerStack[i]!.keyup(ev)
                if (ev.defaultPrevented) {
                    break
                }
            }
            // ev.preventDefault()
        }

        window.onkeydown = (ev: KeyboardEvent) => {
            for (let i = this._controllerStack.length - 1; i >= 0; --i) {
                this._controllerStack[i]!.keydown(ev)
                if (ev.defaultPrevented) {
                    break
                }
            }
            // ev.preventDefault()
        }
    }
}
