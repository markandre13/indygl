export class VertexBuffer {
    buffer: GPUBuffer
    constructor(device: GPUDevice, xyz: Float32Array) {
        this.buffer = device.createBuffer({
            size: xyz.byteLength,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        })
        new Float32Array(this.buffer.getMappedRange()).set(xyz)
        this.buffer.unmap()
    }
}