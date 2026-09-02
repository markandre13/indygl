import { PropertyTab } from "src/editor/app/PropertyTab"
import { ColorUniform } from "../gl/buffers/ColorUniform"
import { Texture } from "../gl/buffers/Texture"
import type { Context } from "../gl/Context"
import { IndyNode, Root, type NodeUiHints } from "./IndyNode"
import type { Mesh } from "./Mesh"


export class Material extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#ab5a61",
        icon: "icons.svg#blender-material-data",
        propertyTab: PropertyTab.MATERIAL
    }
    override get name(): string { return this.dataName ?? this.constructor.name }
    override get uihints(): NodeUiHints { return Material.uiHints }

    private _bindGroup?: GPUBindGroup
    dataName?: string

    private _rgba?: number[]
    private _colorUniform?: ColorUniform

    constructor(root: Root, rgba: number[])
    constructor(root: Root, texture: Texture)
    constructor(root: Root, rgbaOrTexture: number[] | Texture) {
        super(root)
        if (Array.isArray(rgbaOrTexture)) {
            this._rgba = rgbaOrTexture
        }
        // const device = context.device
        // if (rgbaOrTexture instanceof Texture) {
        // this.texture = rgbaOrTexture
        //     this.bindGroup = device.device.createBindGroup({
        //         label: 'material-bind-group',
        //         layout: context.bindGroupLayout.materialTexture,
        //         entries: [
        //             { binding: 0, resource: context.sampler },
        //             { binding: 1, resource: rgbaOrTexture.texture!.createView() },
        //         ],
        //     })
        // } else {
        //     this.colorUniform = new ColorUniform(device)
        //     this.colorUniform.rgba = rgbaOrTexture
        //     this.colorUniform.writeTo(device)

        //     this.bindGroup = device.device.createBindGroup({
        //         label: 'material-bind-group',
        //         layout: context.bindGroupLayout.materialRGBA,
        //         entries: [
        //             { binding: 0, resource: this.colorUniform.buffer },
        //         ],
        //     })
    }

    private init() {
        if (this._colorUniform === undefined && this._rgba !== undefined) {
            const device = this.root._context.device
            this._colorUniform = new ColorUniform(device)
            this._colorUniform.rgba = this._rgba
            this._colorUniform.writeTo(device)
            this._bindGroup = device.device.createBindGroup({
                label: 'material-bind-group',
                layout: this.root.context.bindGroupLayout.materialRGBA,
                entries: [
                    { binding: 0, resource: this._colorUniform.buffer },
                ],
            })
        }
    }

    get colorUniform(): ColorUniform | undefined {
        this.init()
        if (this._colorUniform === undefined) {
            console.error(`Material.colorUniform() === undefined`)
        }
        return this._colorUniform
    }

    get texture(): Texture | undefined {
        return undefined
    }

    get bindGroup(): GPUBindGroup | undefined {
        this.init()
        if (this._colorUniform === undefined) {
            console.error(`Material.bindGroup() === undefined`)
        }
        return this._bindGroup
    }

 
    setBindGroup(pass: GPURenderPassEncoder, node: Mesh) {
        this.init()

        pass.setBindGroup(2, this._bindGroup)
        pass.setVertexBuffer(0, node.points.buffer)
        pass.setVertexBuffer(1, node.normals.buffer)
        // if (this.texture) {
        //     pass.setVertexBuffer(2, node.texcoords.buffer)
        // }
    }
}
