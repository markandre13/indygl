import type { Device } from "../Device"
import { UINT32_NUM_BYTES } from "./sizeof"

export class IndexBuffer {
    buffer: GPUBuffer
    private _length: number
    constructor(device: Device, indices: ArrayLike<number>) {
        this._length = indices.length
        this.buffer = device.device.createBuffer({
            label: 'indexbuffer',
            size: indices.length * UINT32_NUM_BYTES,
            usage: GPUBufferUsage.INDEX,
            mappedAtCreation: true,
        })
        new Uint32Array(this.buffer.getMappedRange()).set(indices)
        this.buffer.unmap()
    }
    get length() {
        return this._length
    }
}
