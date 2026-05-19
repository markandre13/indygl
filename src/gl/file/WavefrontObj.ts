import { StringToLine } from './StringToLine'
import type { MeshSubset } from './MeshSubset'
import type { MeshData } from "../algorithms/MeshData"

interface NamedMeshSubset {
    name: string
    start: number
    length: number
}

// makehuman/shared/wavefront.py
export class WavefrontObj implements MeshData {
    name = ""

    xyz: Float32Array     // x,y,z (coord in makehuman)
    uv: Float32Array      // u,v (texco in makehuman)
    normal: Float32Array  // x,y,z (due to morphing & skinning, normals are calculated in makehuman)

    // vertices per face
    vcount: number[] = []
    // face index for vertex
    fxyz: number[] = [] // (fvert in makehuman)
    // face index for uv
    fuv: number[] = []
    // face index for normal
    fnormal: number[] = []

    groupSubset?: Map<string, MeshSubset>
    materialSubset?: Map<string, MeshSubset>

    toString(): string {
        return `WavefrontObj {name: '${this.name}', vertices: ${this.xyz.length / 3}, faces: ${this.vcount.length}} `
    }

    constructor(filename: string, data: string) {
        this.name = filename
        // if (data === undefined) {
        //     data = FileSystemAdapter.readFile(filename)
        // }
        const groupSubset: NamedMeshSubset[] = []
        const materialSubset: NamedMeshSubset[] = []
        const vcount: number[] = []
        const vertex: number[] = []
        const texcoord: number[] = []
        const normal: number[] = []

        const reader = new StringToLine(data)

        let lineNumber = 0
        for (let line of reader) {
            ++lineNumber
            // console.log(line)
            line = line.trim()
            if (line.length === 0)
                continue
            if (line[0] === '#') {
                // TODO: might want to parse # basemesh <name>
                continue
            }
            const tokens = line.split(/\s+/)
            switch (tokens[0]) {
                // vertex data
                case 'v': // vertex X Y Z [W]
                    if (tokens.length !== 4) {
                        throw Error(`vertex (v) must have 3 arguments in ${line}`)
                    }
                    vertex.push(parseFloat(tokens[1]))
                    vertex.push(parseFloat(tokens[2]))
                    vertex.push(parseFloat(tokens[3]))
                    break
                case 'vt': // vertex texture U V
                    if (tokens.length != 3) {
                        throw Error(`vertex texture (vt) must have 2 arguments in ${line}`)
                    }
                    texcoord.push(parseFloat(tokens[1]))
                    texcoord.push(parseFloat(tokens[2]))
                    break
                case 'vn': // vertex normal I J K
                    if (tokens.length != 4) {
                        throw Error(`vertex normal (vn) must have 3 arguments in ${line}`)
                    }
                    normal.push(parseFloat(tokens[1]))
                    normal.push(parseFloat(tokens[2]))
                    normal.push(parseFloat(tokens[3]))
                    break
                case 'vp': break // vertext parameter space U V W

                // free-form curve/surface attributes
                case 'deg': break
                case 'bmat': break
                case 'step': break
                case 'cstype': break

                // elements
                case 'p': break // point
                case 'l': break // line
                case 'f': // face( vertex[/[texture][/normal]])+
                    vcount.push(tokens.length - 1)
                    for (let i = 1; i < tokens.length; ++i) {
                        const split = tokens[i].split('/')
                        this.fxyz.push(parseInt(split[0]) - 1)
                        if (split.length > 1 && split[1].length > 0) {
                            this.fuv.push(parseInt(split[1]) - 1)
                        }
                        if (split.length > 2 && split[2].length > 0) {
                            this.fnormal.push(parseInt(split[2]) - 1)
                        }
                    }
                    break
                case 'curv': break  // curve
                case 'curv2': break // 2d curve
                case 'surf': break  // surface

                // free-form curve/surface body statements
                case 'parm': break
                case 'trim': break
                case 'hole': break
                case 'scrv': break
                case 'sp': break
                case 'end': break

                // connectivity between free-form surfaces
                case 'con': break

                // grouping
                case 'g': // <groupname>+ the following elements belong to that group    
                    groupSubset.push({ name: tokens[1], start: this.fxyz.length, length: 0 })
                    break
                case 's': break
                case 'mg': break
                case 'o': // <object name>
                    this.name = tokens[1]
                    break

                // display/render attributes
                case 'bevel': break
                case 'c_interp': break
                case 'd_interp': break
                case 'lod': break
                case 'usemtl': // <materialname>
                    materialSubset.push({ name: tokens[1], start: this.fxyz.length, length: 0 })
                    break
                case 'mtllib': break
                case 'shadow_obj': break
                case 'trace_obj': break
                case 'ctech': break
                case 'stech': break

                default:
                    throw Error(`Unknown keyword '${tokens[0]}' in Wavefront OBJ file in line '${line}' of length ${line.length}.`)
            }
        }
        this.vcount = vcount
        this.xyz = new Float32Array(vertex)
        this.uv = new Float32Array(texcoord)
        this.normal = new Float32Array(normal)

        // set group's lengths
        if (groupSubset.length > 0) {
            for (let i = 0; i < groupSubset.length - 1; ++i) {
                groupSubset[i].length = groupSubset[i + 1].start - groupSubset[i].start
            }
            groupSubset[groupSubset.length - 1].length = this.fxyz.length - groupSubset[groupSubset.length - 1].start
        }
        if (groupSubset.length > 0) {
            this.groupSubset = new Map()
            for (const s of groupSubset) {
                this.groupSubset.set(s.name, { start: s.start, length: s.length })
            }
        }

        if (materialSubset.length > 0) {
            for (let i = 0; i < materialSubset.length - 1; ++i) {
                materialSubset[i].length = materialSubset[i + 1].start - materialSubset[i].start
            }
            materialSubset[materialSubset.length - 1].length = this.fxyz.length - materialSubset[materialSubset.length - 1].start
        }
        if (materialSubset.length > 0) {
            this.materialSubset = new Map()
            for (const s of materialSubset) {
                this.materialSubset.set(s.name, { start: s.start, length: s.length })
            }
        }
    }

    // getFaceGroup(name: string): MeshSubset | undefined {
    //     // the facegroups are not groups
    //     // and those might be either stored in one of these:
    //     //   makehuman/data/rigs/default_weights.mhw
    //     //   makehuman/data/poses/benchmark.bvh
    //     //   makehuman/data/poses/tpose.bvh
    //     //   makehuman/data/poseunits/face-poseunits.bvh
    //     // or maybe the code i have here is correct but the weight must be read as part of the rig?

    //     // return undefined
    //     const x = this.groupSubset
    //         .filter(g => g.name === name)
    //     if (x.length !== 1) {
    //         return undefined
    //     }
    //     return x[0]
    // }
}
