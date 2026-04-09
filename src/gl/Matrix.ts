
export class Matrix {
    buffer: GPUBuffer
    constructor(device: GPUDevice) {
        this.buffer = device.createBuffer({
            size: 4 * 16, // sizeof(float32) x 4 x 4
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
    }
    /**
     * Issues a write operation of the provided data into a GPUBuffer.
     */
    writeQueue(queue: GPUQueue, mat4: Float32Array) {
        queue.writeBuffer(
            this.buffer,
            0,
            mat4.buffer,
            mat4.byteOffset,
            mat4.byteLength
        )
    }
}
