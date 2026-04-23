import type { ModelUniform } from "../buffers/ModelUniform"
import { PositionBuffer } from "../buffers/PositionBuffer"
import { FLOAT32_NUM_BYTES } from "../buffers/sizeof"
import { Uniform } from "../buffers/Uniform"
import type { CanvasContext } from "../CanvasContext"
import type { Device } from "../Device"
import { Shader } from "./Shader"

export const PICK_SIZE = 5

export class ShaderP3_PickPoint extends Shader {
    pipeline: GPURenderPipeline
    pickUniform: Uniform
    constructor(device: Device,
        context: CanvasContext
    ) {
        super(device, code)
        const pipelineDef: GPURenderPipelineDescriptor = {
            layout: 'auto',
            vertex: {
                buffers: [{
                    arrayStride: PositionBuffer.bytesPerVertex,
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 0, ...PositionBuffer.position },
                    ]
                }],
                module: this.module
            },
            fragment: {
                module: this.module,
                targets: [{ format: context.presentationFormat }]
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }
        this.pipeline = device.device!.createRenderPipeline(pipelineDef)

        this.pickUniform = new Uniform(device.device, ["vec2f"])
    }
    
    bindGroup?: GPUBindGroup
    private createBindGroup(context: CanvasContext, modelUniforms: ModelUniform): GPUBindGroup {
        if (this.bindGroup === undefined) {
            this.bindGroup = this.device.device.createBindGroup({
                layout: this.pipeline.getBindGroupLayout(0),
                entries: [
                    { binding: 0, resource: context.sceneUniforms.buffer },
                    { binding: 1, resource: modelUniforms.buffer },
                    { binding: 2, resource: this.pickUniform.buffer }
                ],
            })
        }
        return this.bindGroup
    }

    draw(pass: GPURenderPassEncoder,
        context: CanvasContext,
        modelUniforms: ModelUniform,
        positions: PositionBuffer,
        offset?: number,
        length?: number
    ) {
        this.pickUniform.values[0][0] = PICK_SIZE / context.canvas.clientWidth
        this.pickUniform.values[0][1] = PICK_SIZE / context.canvas.clientHeight
        this.pickUniform.writeTo(this.device)

        pass.setPipeline(this.pipeline)
        pass.setBindGroup(0, this.createBindGroup(context, modelUniforms))
        pass.setVertexBuffer(0, positions.buffer)
        const firstInstance = offset ? offset : 0
        const instanceCount = length ? length : (positions.buffer.size / 3 / FLOAT32_NUM_BYTES) - firstInstance
        pass.draw(6, instanceCount, 0, firstInstance)
    }
}

const code = /* wgsl */ `
    struct SceneUniforms { 
        uProjectionMatrix: mat4x4f,
    };
    struct ModelUniforms { 
        uModelViewMatrix: mat4x4f,
        uNormalMatrix: mat4x4f,
    };
    struct PickUniforms { 
        scale: vec2f,
    };
    @group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
    @group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;
    @group(0) @binding(2) var<uniform> pickUniforms: PickUniforms;

    struct VSOutput {
        @builtin(position) Position: vec4f,
        @location(0) color: vec4f,
    }

    @vertex
    fn vertex_main(
        @location(0) vert: vec3f,
        @builtin(vertex_index) vNdx: u32,
        @builtin(instance_index) iNdx: u32,
    ) -> VSOutput {
        // rectangle to draw the pick point
        let rectangle = array(
            vec2f(-1, -1), vec2f( 1, -1), vec2f(-1,  1),
            vec2f(-1,  1), vec2f( 1, -1), vec2f( 1,  1),
        );
        // position of the vertex on screen
        let indexPos = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4(vert, 1);
        // position of a point of the rectangle to draw for the pick point
        let pointPos = vec4f(rectangle[vNdx] * pickUniforms.scale * indexPos.w, 0, 0) + indexPos;

        // encode instance index as rgb color
        let i = iNdx + 1;
        let r = f32(i & 0xff) / 255;
        let g = f32((i>>8) & 0xff) / 255;
        let b = f32((i>>16) & 0xff) / 255;
        return VSOutput(pointPos, vec4f(r, g, b, 1));
    }

    @fragment
    fn fragment_main(
        vin: VSOutput
    ) -> @location(0) vec4f {
        return vin.color;
    }
`
