/**
 * WebGPU vectices hold arbitrary data like position, normal, uv, color, ...
 */
export class VertexBuffer {
    buffer: GPUBuffer
    constructor(device: GPUDevice, xyz: ArrayLike<number>) {
        this.buffer = device.createBuffer({
            label: "vertexbuffer",
            size: xyz.length * 4,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        })
        new Float32Array(this.buffer.getMappedRange()).set(xyz)
        this.buffer.unmap()
    }
}

