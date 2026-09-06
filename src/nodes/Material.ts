import { PropertyTab } from "src/editor/app/PropertyTab"
import { ColorUniform } from "../gl/buffers/ColorUniform"
import { Texture } from "../gl/buffers/Texture"
import { IndyNode, Root, type NodeUiHints } from "./IndyNode"

/**
 * TODO: for Material to work similar to Blender, we'd need a global list of materials
 *       and a link to that material in the node tree.
 *       have a look at how USD does it
 */
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
    private _textureFilename?: string

    private _texture?: Texture
    private _colorUniform?: ColorUniform

    constructor(root: Root, rgba: number[])
    constructor(root: Root, texture: string)
    constructor(root: Root, rgbaOrTexture: number[] | string) {
        super(root)
        if (Array.isArray(rgbaOrTexture)) {
            this._rgba = rgbaOrTexture
        } else {
            this._textureFilename = rgbaOrTexture
        }
    }

    private init() {
        if (this._colorUniform === undefined) {
            const context = this.root._context
            const device = this.root._context.device
            if (this._rgba !== undefined) {
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
            if (this._textureFilename !== undefined) {
                const texture = new Texture()
                texture.load(this.root.context, this._textureFilename)
                    .then(() => {
                        this._texture = texture
                        this._bindGroup = device.device.createBindGroup({
                            label: 'material-bind-group',
                            layout: context.bindGroupLayout.materialTexture,
                            entries: [
                                { binding: 0, resource: context.sampler },
                                { binding: 1, resource: texture.texture!.createView() },
                            ],
                        })
                    })
            }
        }
    }

    get colorUniform(): ColorUniform | undefined {
        this.init()
        return this._colorUniform
    }

    get texture(): Texture | undefined {
        this.init()
        return this._texture
    }

    get bindGroup(): GPUBindGroup | undefined {
        this.init()
        return this._bindGroup
    }
}
