import { mat4 } from 'gl-matrix'
import { SceneUniform } from './buffers/SceneUniform'
import type { Device } from './Device'
import type { Controller } from './controllers/Controller'
import { Mat4Model } from './Mat4Model'
import { bind } from 'src/editor/appkit/details/decorators/bind'
import { BindGroupLayoutCollection } from './details/BindGroupLayoutCollection'
import { ShaderCollection } from './details/ShaderCollection'
import type { IndyNode } from "src/nodes/IndyNode"
import { replaceChildren } from 'toad.jsx/jsx-runtime'

export enum Projection {
    ORTHOGONAL,
    PERSPECTIVE
}

class Selection {
    active?: IndyNode
    selected = new Set<IndyNode>()

    clear() {
        this.active = undefined
        this.selected.clear()
    }

    add(node: IndyNode) {
        this.active = node
        this.selected.add(node)
    }
}

export class Context {
    device: Device
    canvas: HTMLCanvasElement
    context: GPUCanvasContext | null = null;
    presentationFormat: GPUTextureFormat


    readonly selection = new Selection()

    bindGroupLayout: BindGroupLayoutCollection
    shader: ShaderCollection

    sampler: GPUSampler
    sceneUniforms: SceneUniform
    // renderPassDescriptor: GPURenderPassDescriptor

    private _controllerStack: Controller[] = []

    pushController(controller: Controller) {
        this._controllerStack.push(controller)
        this.invalidate()
        const status = document.getElementById("status")
        if (status) {
            const info = controller.info()
            if (info) {
                replaceChildren(status, info)
            }
        }
    }
    popController() {
        this._controllerStack.pop()
        const status = document.getElementById("status")
        if (status) {
            const controller = this._controllerStack[this._controllerStack.length - 1]
            const info = controller.info()
            if (info) {
                replaceChildren(status, info)
            }
        }
        this.invalidate()
    }

    constructor(device: Device, canvas: HTMLCanvasElement) {
        this.device = device
        this.canvas = canvas

        this.bindGroupLayout = new BindGroupLayoutCollection(device)

        const defaultCamera = mat4.create()
        mat4.translate(defaultCamera, defaultCamera, [0.0, 0.0, -24.0])
        this.camera = new Mat4Model(defaultCamera, { default: defaultCamera, local: "camera" })
        this.camera.signal.add(this.invalidate)

        this.setupEventHandling(canvas)

        this.context = canvas.getContext('webgpu')
        if (this.context == null) {
            throw Error('no webgpu')
        }

        this.sceneUniforms = new SceneUniform(this)

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
        this.shader = new ShaderCollection(this)
    }

    /**
     * rgba to be used as the views background color
     */
    backgroundColor = [0.247, 0.247, 0.247, 1.0]
    camera: Mat4Model

    private _paint?: () => void
    private _invalidated = false

    @bind invalidate() {
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

    set paint(callback: () => void) {
        // register new callback and...
        this._paint = callback
        // ...request to use the new callback
        this.invalidate()
    }
    protected doPaint() {
        // console.log(`Controller.doPaint()`)
        // we clear _invalidated here as following call to _paint() may invalidate the view again
        this._invalidated = false

        if (this._paint) {
            mat4.copy(this.sceneUniforms.camera, this.camera.value)
            this.sceneUniforms.writeTo(this.device)
            this.adjustSize()
            this._paint()
        }
        // console.log(`this._controllerStack.length = ${this._controllerStack.length }`)
        for (let i = this._controllerStack.length - 1; i >= 0; --i) {
            this._controllerStack[i]!.paint()
        }
    }

    resetCamera() {
        this.camera.resetToDefault()
    }
    rotateCameraTo(x: number, y: number, z: number) {
        this.camera.rotateTo(x, y, z)
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

    //
    // depth texture
    //
    depthTextureFormat: GPUTextureFormat = 'depth24plus-stencil8';
    depthTexture?: GPUTexture
    private depthTextureView?: GPUTextureView

    invalidateDepthTexture() {
        this.depthTexture?.destroy()
        this.depthTexture = undefined
        this.depthTextureView = undefined
    }

    getDepthTexture(): GPUTexture {
        if (this.depthTexture === undefined) {
            const label = 'depth-texture'
            this.depthTexture = this.device.device!.createTexture({
                label,
                size: [this.canvas.width, this.canvas.height],
                format: this.depthTextureFormat,
                usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
            })
        }
        return this.depthTexture
    }

    getDepthTextureView(): GPUTextureView {
        const depthTexture = this.getDepthTexture()
        if (this.depthTextureView === undefined) {
            const label = 'depth-texture'
            this.depthTextureView = depthTexture.createView({ label })
        }
        return this.depthTextureView!
    }

    private postProcessBindGroup?: GPUBindGroup
    getStencilBindgroup() {
        // re-use causes errors when resizing
        // if (this.postProcessBindGroup === undefined) {
        this.postProcessBindGroup = this.device.device!.createBindGroup({
            label: 'outline',
            layout: this.shader.outline.outlineBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.getDepthTexture()
                        .createView({ aspect: 'stencil-only' })
                },
            ],
        })
        // }
        return this.postProcessBindGroup
    }

    getRenderPassDescriptor(view = this.getCanvasView(), backgroundColor = this.backgroundColor) {
        const renderPassDescriptor: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    view: view,
                    clearValue: backgroundColor,
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
            depthStencilAttachment: {
                view: this.getDepthTextureView(),

                depthClearValue: 1.0,
                depthLoadOp: 'clear',
                depthStoreOp: 'store',

                stencilClearValue: 0,
                stencilLoadOp: 'clear',
                stencilStoreOp: 'store'
            },
        }

        // renderPassDescriptor.colorAttachments[0]!.clearValue = this.backgroundColor
        // // set render destination
        // renderPassDescriptor.colorAttachments[0]!.view = textureView ? textureView : this.getCanvasView()
        // renderPassDescriptor.depthStencilAttachment!.view = this.getDepthTextureView()
        return renderPassDescriptor
    }

    private adjustSize() {
        const devicePixelRatio = window.devicePixelRatio
        const pixelWidth = this.canvas.clientWidth * devicePixelRatio
        const pixelHeight = this.canvas.clientHeight * devicePixelRatio
        if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
            this.adjustSizeCore(pixelWidth, pixelHeight)
        }
    }

    private adjustSizeCore(pixelWidth: number, pixelHeight: number) {
        // console.log(`adjust canvas size: canvas.width=${this.canvas.width}, pixelWidth=${pixelWidth}; canvas.height=${this.canvas.height}, pixelHeight=${pixelHeight}`)
        this.canvas.width = pixelWidth
        this.canvas.height = pixelHeight

        this.invalidateDepthTexture()

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
        // resive canvas
        //
        const observer = new ResizeObserver(_entries => {
            this.adjustSize()
            this.invalidate()
        })
        observer.observe(canvas)
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
