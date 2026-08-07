import { PropertyTab } from "src/editor/app/PropertyTab"
import { ColorUniform } from "../gl/buffers/ColorUniform"
import { Texture } from "../gl/buffers/Texture"
import type { Context } from "../gl/Context"
import { IndyNode, type NodeUiHints } from "./IndyNode"
import type { Mesh } from "./Mesh"


export class Material extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#ab5a61",
        icon: "icons.svg#blender-material-data",
        propertyTab: PropertyTab.MATERIAL
    }
    override get name(): string { return this.dataName ?? this.constructor.name }
    override get uihints(): NodeUiHints { return Material.uiHints }

    bindGroup: GPUBindGroup
    dataName?: string

    constructor(context: Context, rgba: number[])
    constructor(context: Context, texture: Texture)
    constructor(context: Context, rgbaOrTexture: number[] | Texture) {
        super(undefined as any) // FIXME
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

    setBindGroup(pass: GPURenderPassEncoder, node: Mesh) {
        pass.setBindGroup(2, this.bindGroup)
        pass.setVertexBuffer(0, node.points.buffer)
        pass.setVertexBuffer(1, node.normals.buffer)
        if (this.texture) {
            pass.setVertexBuffer(2, node.texcoords.buffer)
        }
    }
}
