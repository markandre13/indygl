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
