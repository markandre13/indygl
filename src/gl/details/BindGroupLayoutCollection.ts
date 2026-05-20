import type { Context } from '../Context'
import type { Device } from '../Device'

export class BindGroupLayoutCollection {
    scene: GPUBindGroupLayout
    model: GPUBindGroupLayout
    materialRGBA: GPUBindGroupLayout
    materialTexture: GPUBindGroupLayout

    constructor(device: Device) {
        const d = device.device
        this.scene = d.createBindGroupLayout({
            label: 'scene',
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
            label: 'model',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform",
                    minBindingSize: 0
                }
            }]
        })
        this.materialRGBA = d.createBindGroupLayout({
            label: 'material-rgba',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: {
                    type: "uniform",
                    minBindingSize: 0
                }
            }]
        })

        this.materialTexture = d.createBindGroupLayout({
            label: 'material-texture',
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                sampler: { type: "filtering" }
            }, {
                binding: 1,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                texture: {}
            }]
        })
    }
}
