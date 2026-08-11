import { PropertyTab } from 'src/editor/app/PropertyTab'
import { IndyNode, type NodeUiHints } from './IndyNode'
import { BlendShapeGroup } from './BlendShapeGroup'
import { vec3, type mat4 } from 'gl-matrix'
import { Mesh } from './Mesh'
import { Material } from './Material'
import { MorphTarget } from 'src/MorphTarget'
import { WavefrontObj } from 'src/gl/file/WavefrontObj'
import type { MeshData } from 'src/gl/algorithms/MeshData'
import { hsv2rgb } from 'toad.js/util/color'

export class BlendShape extends IndyNode {
    static override uiHints: NodeUiHints = {
        color: "#6387d2",
        icon: "icons.svg#blender-shapekey-data",
        propertyTab: PropertyTab.SHAPE_KEY
    }
    override get name(): string { return this.shapeName }
    override get uihints(): NodeUiHints { return BlendShape.uiHints }

    private shapeName: string
    private filename: string

    constructor(parent: BlendShapeGroup, name: string, filename: string) {
        super(parent)
        this.shapeName = name
        this.filename = filename
        this.prepare()
    }

    transform?: mat4

    // TODO: maybe TDD this stuff 1st???

    _meshData?: MeshData
    _mesh?: Mesh

    async meshData() {
        if (this._meshData) {
            return this._meshData
        }
        const response = await fetch(this.filename)
        if (!response.ok) {
            throw Error(`failed to load '${this.filename}': ${response.status} ${response.statusText}: ${await response.text()}`)
        }
        const body = await response.text()
        this._meshData = new WavefrontObj(this.filename, body)
        return this._meshData
    }

    async prepare() {
        if (!(this.parent instanceof BlendShapeGroup)) {
            throw Error(`yikes: Blendshape does not have ${BlendShapeGroup.name} parent`)
        }
        const neutralBlendshape = this.parent.children[0]
        if (!(neutralBlendshape instanceof BlendShape)) {
            throw Error(`yikes: Blendshape's 1st sibling is not a ${BlendShape.name}`)
        }
        if (neutralBlendshape === this) {
            return
        }

        const neutral = await neutralBlendshape.meshData()
        const shape = await this.meshData()
        const morph = new MorphTarget()
        morph.diff(neutral.xyz!, shape.xyz!)

        // now turn morph into mesh...
        // two variants:
        // * neutral with colors for displacement
        // * neutral, with just the parts that move

        const mesh = new Mesh(this, shape)
        mesh.dataName = `Mesh for Blendshape ${this.shapeName}`
        // mesh.material = new Material(this.context, [0, 0.2, 1, 1])

        const distance = new Array<number>(mesh.indices.length)
        for(let i=0;i<distance.length; ++i) {
            distance[i] = 0
        }
        let max = 0
        for (let i = 0, i3 = 0; i < morph.indices.length; ++i, i3 += 3) {
            const v = vec3.fromValues(morph.dxyz[i3], morph.dxyz[i3 + 1], morph.dxyz[i3 + 2])
            const d = vec3.length(v)
            max = Math.max(max, d)
            distance[morph.indices[i]] = d
        }

        const color = new Array<number>(mesh.indices.length * 3)
        for (let i = 0, i3 = 0; i < distance.length; ++i, i3 += 3) {
            // const rgb = hsv2rgb(distance[i] / max * 360, 1, 1)
            const d = distance[i] / max
            // console.log(`d[i] = ${distance[i]}`)
            const rgb = {r:d, g:0, b:1-d}
            color[i3] = rgb.r
            color[i3 + 1] = rgb.g
            color[i3 + 2] = rgb.b
        }
        mesh.rgb = color

        this._mesh = mesh

        this.context.invalidate()
    }

    /**
     * return a mesh to render or undefined
     */
    get mesh(): Mesh | undefined {
        return this._mesh
    }
}
