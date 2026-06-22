import type { Device } from "../Device"
import { FLOAT32_NUM_BYTES } from "./sizeof"

/**
 * WebGPU vectices hold arbitrary data like position, normal, uv, color, ...
 */
export class VertexBuffer {
    buffer: GPUBuffer
    constructor(device: Device, data: ArrayLike<number>, usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
        this.buffer = device.device.createBuffer({
            label: "vertexbuffer",
            size: data.length * FLOAT32_NUM_BYTES,
            usage: usage,
            mappedAtCreation: true,
        })
        new Float32Array(this.buffer.getMappedRange()).set(data)
        this.buffer.unmap()
    }
    update(data: ArrayLike<number>) {
        return new Promise<void>((resolve) => {
            this.buffer.mapAsync(GPUMapMode.WRITE).then(
                () => {
                    new Float32Array(this.buffer.getMappedRange()).set(data)
                    this.buffer.unmap()
                    resolve()
                }
            )
        })
    }
}


// MAP_READ         0x0001  can be mapped for reading via mapAsync()
// MAP_WRITE        0x0002  can be mapped for writing via mapAsync()
// COPY_SRC         0x0004  can be source of copy operation, ie. GPUCommandEncoder.copyBufferToBuffer()
// COPY_DST         0x0008  can be destination of copy operation, ie. copyTextureToBuffer()

// INDEX            0x0010  can be used as index buffer
// VERTEX
// UNIFORM
// STORAGE
// INDIRECT         0x0100  can be used to store indirect command arguments
// QUERY_RESOLVE    0x0200  can be used to store capture query results, ie. 
