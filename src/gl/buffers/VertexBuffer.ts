import { FLOAT32_SIZE } from "../../geom-cube"
import type { Device } from "../Device"

/**
 * WebGPU vectices hold arbitrary data like position, normal, uv, color, ...
 */
export class VertexBuffer {
    buffer: GPUBuffer
    constructor(device: Device, data: ArrayLike<number>) {
        this.buffer = device.device.createBuffer({
            label: "vertexbuffer",
            size: data.length * FLOAT32_SIZE,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true,
        })
        new Float32Array(this.buffer.getMappedRange()).set(data)
        this.buffer.unmap()
    }
}

