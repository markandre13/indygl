import type { Device } from "../Device"

const FLOAT32_SIZE = 4

export type WslVertexFormat = "mat4x4f" | "vec4f"

const formats = new Map<WslVertexFormat, any>([
    ["mat4x4f", FLOAT32_SIZE * 16],
    ["vec4f", FLOAT32_SIZE * 4]
])

export class Uniform {
    buffer: GPUBuffer
    protected float32array: Float32Array
    protected values: Float32Array[]

    constructor(device: GPUDevice, format: WslVertexFormat[]) {
        let size = 0
        for (const f of format) {
            size += formats.get(f)
        }
        this.buffer = device.createBuffer({
            size,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        })
        this.float32array = new Float32Array(size / FLOAT32_SIZE)
        this.values = new Array(format.length)
        let offset = 0
        for (let i = 0; i < format.length; ++i) {
            let n = formats.get(format[i])
            this.values[i] = this.float32array.subarray(offset / FLOAT32_SIZE, (offset + n) / FLOAT32_SIZE)
            // console.log(`value[${i}] = ${offset}, ${n}`)
            offset += n
        }
    }
    /**
     * Issues a write operation of the provided data into a GPUBuffer.
     */
    writeTo(device: Device) {
        device.device.queue.writeBuffer(
            this.buffer,
            0,
            this.float32array.buffer,
            this.float32array.byteOffset,
            this.float32array.byteLength
        )
    }
}
