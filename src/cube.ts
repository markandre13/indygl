import { FLOAT32_NUM_BYTES } from "./gl/buffers/sizeof"

export const cubeVertexSize = 4 * 10 // Byte size of one cube vertex.
export const cubePositionOffset = 0
export const cubeColorOffset = 4 * 4 // Byte offset of cube vertex color attribute.
export const cubeUVOffset = 4 * 8
export const cubeVertexCount = 36

// prettier-ignore
export const cubeVertexArray = new Float32Array([
    // float4 position, float4 color, float2 uv,
    1, -1, 1, 1, 1, 0, 1, 1, 0, 1,
    -1, -1, 1, 1, 0, 0, 1, 1, 1, 1,
    -1, -1, -1, 1, 0, 0, 0, 1, 1, 0,
    1, -1, -1, 1, 1, 0, 0, 1, 0, 0,
    1, -1, 1, 1, 1, 0, 1, 1, 0, 1,
    -1, -1, -1, 1, 0, 0, 0, 1, 1, 0,

    1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
    1, -1, 1, 1, 1, 0, 1, 1, 1, 1,
    1, -1, -1, 1, 1, 0, 0, 1, 1, 0,
    1, 1, -1, 1, 1, 1, 0, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
    1, -1, -1, 1, 1, 0, 0, 1, 1, 0,

    -1, 1, 1, 1, 0, 1, 1, 1, 0, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, -1, 1, 1, 1, 0, 1, 1, 0,
    -1, 1, -1, 1, 0, 1, 0, 1, 0, 0,
    -1, 1, 1, 1, 0, 1, 1, 1, 0, 1,
    1, 1, -1, 1, 1, 1, 0, 1, 1, 0,

    -1, -1, 1, 1, 0, 0, 1, 1, 0, 1,
    -1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    -1, 1, -1, 1, 0, 1, 0, 1, 1, 0,
    -1, -1, -1, 1, 0, 0, 0, 1, 0, 0,
    -1, -1, 1, 1, 0, 0, 1, 1, 0, 1,
    -1, 1, -1, 1, 0, 1, 0, 1, 1, 0,

    1, 1, 1, 1, 1, 1, 1, 1, 0, 1,
    -1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
    -1, -1, 1, 1, 0, 0, 1, 1, 1, 0,
    -1, -1, 1, 1, 0, 0, 1, 1, 1, 0,
    1, -1, 1, 1, 1, 0, 1, 1, 0, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 0, 1,

    1, -1, -1, 1, 1, 0, 0, 1, 0, 1,
    -1, -1, -1, 1, 0, 0, 0, 1, 1, 1,
    -1, 1, -1, 1, 0, 1, 0, 1, 1, 0,
    1, 1, -1, 1, 1, 1, 0, 1, 0, 0,
    1, -1, -1, 1, 1, 0, 0, 1, 0, 1,
    -1, 1, -1, 1, 0, 1, 0, 1, 1, 0,
])

export const cube_XYZ_RGB = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: [
        -1, 1, -1, 0, 0, 1,
        1, 1, -1, 0, 0.5, 1,
        1, -1, -1, 0, 1, 0,
        -1, -1, -1, 0.5, 1, 0,

        -1, 1, 1, 1, 0.5, 0,
        1, 1, 1, 1, 0, 0,
        1, -1, 1, 1, 0, 0.5,
        -1, -1, 1, 1, 0, 1
    ],
    vertexCount: 8,
    bytesPerVertex: FLOAT32_NUM_BYTES * 6,
    /**
     * offsets within vertex
     */
    layout: {
        POSITION: { offset: FLOAT32_NUM_BYTES * 0, format: 'float32x3' },
        COLOR: { offset: FLOAT32_NUM_BYTES * 3, format: 'float32x3' },
        // UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}

//  0     1
// 3     2
//
//  4     5
// 7     6
export const cube_XYZ = [
    -1, 1, -1,
    1, 1, -1,
    1, -1, -1,
    -1, -1, -1,

    -1, 1, 1,
    1, 1, 1,
    1, -1, 1,
    -1, -1, 1,
]

export const cube_RGB = [
    0, 0, 1,
    0, 0.5, 1,
    0, 1, 0,
    0.5, 1, 0,

    1, 0.5, 0,
    1, 0, 0,
    1, 0, 0.5,
    1, 0, 1
]

export const cube_quads = [
    // top
    0, 1, 2, 3,
    // left
    0, 3, 7, 4,
    // back
    1, 0, 4, 5,
    // front
    3, 2, 6, 7,
    // right
    1, 5, 6, 2,
    // bottom
    5, 4, 7, 6
]

export const cube_IDX = [
    // top
    0, 1, 2,
    0, 2, 3,
    // left
    0, 3, 7,
    0, 7, 4,
    // back
    1, 0, 4,
    1, 4, 5,
    // front
    3, 2, 6,
    3, 6, 7,
    // right
    1, 5, 6,
    1, 6, 2,
    // bottom
    5, 4, 7,
    5, 7, 6,
]
