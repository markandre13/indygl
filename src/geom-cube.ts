/**
 * a cube defined by 36 vertices
 * 
 * 36 vertices = 3 vertices per triangle, 2 triangles per side, 6 sides
 */
// prettier-ignore
const cubeVertexArray = new Float32Array([
    // float4 position, float4 normal, float2 uv,
    1, -1, 1, 1, 0, -1, 0, 1, 0, 1,
    -1, -1, 1, 1, 0, -1, 0, 1, 1, 1,
    -1, -1, -1, 1, 0, -1, 0, 1, 1, 0,
    1, -1, -1, 1, 0, -1, 0, 1, 0, 0,
    1, -1, 1, 1, 0, -1, 0, 1, 0, 1,
    -1, -1, -1, 1, 0, -1, 0, 1, 1, 0,

    1, 1, 1, 1, 1, 0, 0, 1, 0, 1,
    1, -1, 1, 1, 1, 0, 0, 1, 1, 1,
    1, -1, -1, 1, 1, 0, 0, 1, 1, 0,
    1, 1, -1, 1, 1, 0, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 0, 0, 1, 0, 1,
    1, -1, -1, 1, 1, 0, 0, 1, 1, 0,

    -1, -1, 1, 1, -1, 0, 0, 1, 0, 1,
    -1, 1, 1, 1, -1, 0, 0, 1, 1, 1,
    -1, 1, -1, 1, -1, 0, 0, 1, 1, 0,
    -1, -1, -1, 1, -1, 0, 0, 1, 0, 0,
    -1, -1, 1, 1, -1, 0, 0, 1, 0, 1,
    -1, 1, -1, 1, -1, 0, 0, 1, 1, 0,

    -1, 1, 1, 1, 0, 1, 0, 1, 0, 1,
    1, 1, 1, 1, 0, 1, 0, 1, 1, 1,
    1, 1, -1, 1, 0, 1, 0, 1, 1, 0,
    -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,
    -1, 1, 1, 1, 0, 1, 0, 1, 0, 1,
    1, 1, -1, 1, 0, 1, 0, 1, 1, 0,

    // FRONT
    1, 1, 1, 1, 0, 0, 1, 1, 0, 1,
    -1, 1, 1, 1, 0, 0, 1, 1, 1, 1,
    -1, -1, 1, 1, 0, 0, 1, 1, 1, 0,
    -1, -1, 1, 1, 0, 0, 1, 1, 1, 0,
    1, -1, 1, 1, 0, 0, 1, 1, 0, 0,
    1, 1, 1, 1, 0, 0, 1, 1, 0, 1,

    1, -1, -1, 1, 0, 0, -1, 1, 0, 1,
    -1, -1, -1, 1, 0, 0, -1, 1, 1, 1,
    -1, 1, -1, 1, 0, 0, -1, 1, 1, 0,
    1, 1, -1, 1, 0, 0, -1, 1, 0, 0,
    1, -1, -1, 1, 0, 0, -1, 1, 0, 1,
    -1, 1, -1, 1, 0, 0, -1, 1, 1, 0,
])

const FLOAT32_SIZE = 4

export type TypedArrayView =
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

export type TypedArrayConstructor =
    | Int8ArrayConstructor
    | Uint8ArrayConstructor
    | Int16ArrayConstructor
    | Uint16ArrayConstructor
    | Int32ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor

type GPUVertexDef = Omit<GPUVertexAttribute, "shaderLocation">
type VertexLayout = { [name: string]: GPUVertexDef }

interface VertexData {
    vertices: Float32Array // TypedArrayView,
    vertexCount: number
    bytesPerVertex: number
    layout: VertexLayout
}

export const cubeData: VertexData = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: cubeVertexArray,
    vertexCount: 36,
    bytesPerVertex: FLOAT32_SIZE * 10,
    /**
     * offsets within vertex
     */
    layout: {
        POSITION: { offset: FLOAT32_SIZE * 0, format: 'float32x4' },
        NORMAL: { offset: FLOAT32_SIZE * 4, format: 'float32x4' },
        UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}

const a: GPUVertexFormat = "float16"
const m = new Map<GPUVertexFormat, any>()
m.set(a, 1)
m.set("float16", 1)

type WslVertexFormat = "mat4x4f" | "vec4f"

// const m1 = new Map<GPUVertexFormat, any>(
//     [["", 1]]
// )


const formats = new Map<WslVertexFormat, any>([
    ["mat4x4f", FLOAT32_SIZE * 16],
    ["vec4f", FLOAT32_SIZE * 4]
])

export class Uniform {

    constructor(format: WslVertexFormat[]) {
        let size = 0
        for (const f of format) {
            size += formats.get(f)
        }
        console.log(size)
    }
}

new Uniform(["mat4x4f", "mat4x4f", "vec4f"])

// pad to 4
// WebGPU mat3 are 12 floats (padded), WebGL they're 9.
//        vec3 are 4 float

// struct Uniforms {
//   worldViewProjectionMatrix: mat4x4f,
//   worldMatrix: mat4x4f,
//   color: vec4f,
// };

16

//                           32 + 8
// const uniformBufferSize = (2 * 16 + 3 + 1 + 4) * 4;
// const uniformBuffer = device.createBuffer({
//   size: uniformBufferSize,
//   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// });
// const uniformValues = new Float32Array(uniformBufferSize / 4);
// const worldViewProjection = uniformValues.subarray(0, 16);
// const worldInverseTranspose = uniformValues.subarray(16, 32);
// const colorValue = uniformValues.subarray(32, 36);
// colorValue.set([1,0.5,0])