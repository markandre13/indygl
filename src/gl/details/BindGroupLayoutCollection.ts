import type { Context } from '../Context'
import type { Device } from '../Device'

export class BindGroupLayoutCollection {
    scene: GPUBindGroupLayout
    model: GPUBindGroupLayout
    material: GPUBindGroupLayout

    constructor(device: Device) {
        const d = device.device
        this.scene = d.createBindGroupLayout({
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
        this.model = d.createBindGroupLayout({
            label: 'model-bind-group-layout',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform",
                    minBindingSize: 0
                }
            }]
        })
        this.material = d.createBindGroupLayout({
            label: 'material-bind-group-layout',
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
}
