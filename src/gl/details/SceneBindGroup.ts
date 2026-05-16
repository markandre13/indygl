import type { SceneUniform } from '../buffers/SceneUniform'
import type { Device } from '../Device'


export class SceneBindGroup {
    static layout: GPUBindGroupLayout
    bindGroup: GPUBindGroup
    constructor(device: Device, camera: SceneUniform) {
        if (SceneBindGroup.layout === undefined) {
            SceneBindGroup.layout = device.device.createBindGroupLayout({
                label: 'camera-bind-group-layout',
                entries: [{
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                    buffer: {
                        type: "uniform",
                        minBindingSize: 0
                    }
                }]
            })
        }
        this.bindGroup = device.device.createBindGroup({
            label: 'camera-bind-group',
            layout: SceneBindGroup.layout,
            entries: [
                { binding: 0, resource: camera },
            ],
        })
    }
}
