import { mat4 } from "gl-matrix"

// See: https://www.google.com/search?q=fibonacci+sphere
function createFibonacciSphereVertices({
    numSamples,
    radius,
}: {
    numSamples: number
    radius: number
}) {
    const vertices = []
    const increment = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < numSamples; ++i) {
        const offset = 2 / numSamples
        const y = i * offset - 1 + offset / 2
        const r = Math.sqrt(1 - Math.pow(y, 2))
        const phi = (i % numSamples) * increment
        const x = Math.cos(phi) * r
        const z = Math.sin(phi) * r
        vertices.push(x * radius, y * radius, z * radius)
    }
    return new Float32Array(vertices)
}

const adapter = await navigator.gpu?.requestAdapter({
    featureLevel: 'compatibility',
})
const device = await adapter?.requestDevice()!

// Get a WebGPU context from the canvas and configure it
const canvas = document.querySelector('canvas') as HTMLCanvasElement
const context = canvas.getContext('webgpu')!
const devicePixelRatio = window.devicePixelRatio
canvas.width = canvas.clientWidth * devicePixelRatio
canvas.height = canvas.clientHeight * devicePixelRatio
const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
context.configure({
    device,
    format: presentationFormat,
})

// Create a bind group layout so we can share the bind groups
// with multiple pipelines.
const bindGroupLayout = device.createBindGroupLayout({
    entries: [
        {
            binding: 0,
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
        },
        {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {},
        },
        {
            binding: 2,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {},
        },
    ],
})

const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
})

// Compile all 4 shaders
const shaderModules = Object.fromEntries(
    Object.entries({
        orangeFragWGSL: /*wgsl*/`
            @fragment fn fs() -> @location(0) vec4f {
                return vec4f(1, 0.5, 0.2, 1);
            }`,
        texturedFragWGSL: /*wgsl*/`
            struct VSOutput {
                @location(0) texcoord: vec2f,
                };

                @group(0) @binding(1) var s: sampler;
                @group(0) @binding(2) var t: texture_2d<f32>;

                @fragment fn fs(vsOut: VSOutput) -> @location(0) vec4f {
                let color = textureSample(t, s, vsOut.texcoord);
                if (color.a < 0.1) {
                    discard;
                }
                return color;}`,
        distanceSizedPointsVertWGSL: /*wgsl*/`
            struct Vertex {
                @location(0) position: vec4f,
            };

            struct Uniforms {
                matrix: mat4x4f,
                resolution: vec2f,
                size: f32,
            };

            struct VSOutput {
                @builtin(position) position: vec4f,
                @location(0) texcoord: vec2f,
            };

            @group(0) @binding(0) var<uniform> uni: Uniforms;

            @vertex fn vs(
                vert: Vertex,
                @builtin(vertex_index) vNdx: u32,
            ) -> VSOutput {
            let points = array(
                vec2f(-1, -1),
                vec2f( 1, -1),
                vec2f(-1,  1),
                vec2f(-1,  1),
                vec2f( 1, -1),
                vec2f( 1,  1),
            );
            var vsOut: VSOutput;
            let pos = points[vNdx];
            let clipPos = uni.matrix * vert.position;
            let pointPos = vec4f(pos * uni.size / uni.resolution, 0, 0);
            vsOut.position = clipPos + pointPos;
            vsOut.texcoord = pos * 0.5 + 0.5;
            return vsOut;
            }`,
        fixedSizePointsVertWGSL: /*wgsl*/`
            struct Vertex {
                @location(0) position: vec4f,
                };

                struct Uniforms {
                matrix: mat4x4f,
                resolution: vec2f,
                size: f32,
                };

                struct VSOutput {
                @builtin(position) position: vec4f,
                @location(0) texcoord: vec2f,
                };

                @group(0) @binding(0) var<uniform> uni: Uniforms;

                @vertex fn vs(
                    vert: Vertex,
                    @builtin(vertex_index) vNdx: u32,
                ) -> VSOutput {
                let points = array(
                    vec2f(-1, -1),
                    vec2f( 1, -1),
                    vec2f(-1,  1),
                    vec2f(-1,  1),
                    vec2f( 1, -1),
                    vec2f( 1,  1),
                );
                var vsOut: VSOutput;
                let pos = points[vNdx];
                let clipPos = uni.matrix * vert.position;
                let pointPos = vec4f(pos * uni.size / uni.resolution * clipPos.w, 0, 0);
                vsOut.position = clipPos + pointPos;
                vsOut.texcoord = pos * 0.5 + 0.5;
                return vsOut;
                }`,
    }).map(([key, code]) => [key, device.createShaderModule({ code })])
)

const fragModules = [
    shaderModules.orangeFragWGSL,
    shaderModules.texturedFragWGSL,
]

const vertModules = [
    shaderModules.distanceSizedPointsVertWGSL,
    shaderModules.fixedSizePointsVertWGSL,
]

const depthFormat = 'depth24plus'

// make pipelines for each combination
const pipelines = vertModules.map((vertModule) =>
    fragModules.map((fragModule) =>
        device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: vertModule,
                buffers: [
                    {
                        arrayStride: 3 * 4, // 3 floats, 4 bytes each
                        stepMode: 'instance',
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x3' }, // position
                        ],
                    },
                ],
            },
            fragment: {
                module: fragModule,
                targets: [
                    {
                        format: presentationFormat,
                        blend: {
                            color: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                            },
                            alpha: {
                                srcFactor: 'one',
                                dstFactor: 'one-minus-src-alpha',
                            },
                        },
                    },
                ],
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: depthFormat,
            },
        })
    )
)

const vertexData = createFibonacciSphereVertices({
    radius: 1,
    numSamples: 1000,
})
const kNumPoints = vertexData.length / 3

const vertexBuffer = device.createBuffer({
    label: 'vertex buffer vertices',
    size: vertexData.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
})
device.queue.writeBuffer(vertexBuffer, 0, vertexData)

const uniformValues = new Float32Array(16 + 2 + 1 + 1)
const uniformBuffer = device.createBuffer({
    size: uniformValues.byteLength,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
})
const kMatrixOffset = 0
const kResolutionOffset = 16
const kSizeOffset = 18
const matrixValue = uniformValues.subarray(kMatrixOffset, kMatrixOffset + 16)
const resolutionValue = uniformValues.subarray(
    kResolutionOffset,
    kResolutionOffset + 2
)
const sizeValue = uniformValues.subarray(kSizeOffset, kSizeOffset + 1)

// Use canvas 2d to make texture data
const ctx = new OffscreenCanvas(64, 64).getContext('2d')!
ctx.font = '60px sans-serif'
ctx.textAlign = 'center'
ctx.textBaseline = 'middle'
ctx.fillText('🦋', 32, 32)

const sampler = device.createSampler()
const texture = device.createTexture({
    size: [ctx.canvas.width, ctx.canvas.height],
    format: 'rgba8unorm',
    usage:
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.RENDER_ATTACHMENT,
})
device.queue.copyExternalImageToTexture(
    { source: ctx.canvas, flipY: true },
    { texture },
    [ctx.canvas.width, ctx.canvas.height]
)

const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
        { binding: 0, resource: uniformBuffer },
        { binding: 1, resource: sampler },
        { binding: 2, resource: texture.createView() },
    ],
})

const renderPassDescriptor: GPURenderPassDescriptor = {
    label: 'our basic canvas renderPass',
    colorAttachments: [
        {
            view: undefined as any, // assigned later
            clearValue: [0.3, 0.3, 0.3, 1],
            loadOp: 'clear',
            storeOp: 'store',
        },
    ],
    depthStencilAttachment: {
        view: undefined as any, // to be filled out when we render
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
    },
}

const settings = {
    fixedSize: true,
    textured: false,
    size: 10,
}

let depthTexture: GPUTexture

function render(time: number) {
    // Convert to seconds.
    time *= 0.001

    // Get the current texture from the canvas context and
    // set it as the texture to render to.
    const canvasTexture = context.getCurrentTexture()
    renderPassDescriptor.colorAttachments[0]!.view = canvasTexture.createView()

    // If we don't have a depth texture OR if its size is different
    // from the canvasTexture when make a new depth texture
    if (
        !depthTexture ||
        depthTexture.width !== canvasTexture.width ||
        depthTexture.height !== canvasTexture.height
    ) {
        if (depthTexture) {
            depthTexture.destroy()
        }
        depthTexture = device.createTexture({
            size: [canvasTexture.width, canvasTexture.height],
            format: depthFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })
    }
    renderPassDescriptor.depthStencilAttachment!.view = depthTexture.createView()

    const { size, fixedSize, textured } = settings

    const pipeline = pipelines[fixedSize ? 1 : 0][textured ? 1 : 0]

    // Set the size in the uniform values
    sizeValue[0] = size

    const fov = (90 * Math.PI) / 180
    const aspect = canvas.clientWidth / canvas.clientHeight
    const projection = mat4.perspectiveZO(mat4.create(), fov, aspect, 0.1, 50)
    const view = mat4.lookAt(mat4.create(),
        [0, 0, 1.5], // position
        [0, 0, 0], // target
        [0, 1, 0] // up
    )
    const viewProjection = mat4.multiply(mat4.create(), projection, view)
    mat4.rotateY(matrixValue, viewProjection, time)
    mat4.rotateX(matrixValue, matrixValue, time * 0.1)

    // Update the resolution in the uniform values
    resolutionValue.set([canvasTexture.width, canvasTexture.height])

    // Copy the uniform values to the GPU
    device.queue.writeBuffer(uniformBuffer, 0, uniformValues)

    const encoder = device.createCommandEncoder()
    const pass = encoder.beginRenderPass(renderPassDescriptor)
    pass.setPipeline(pipeline)
    pass.setVertexBuffer(0, vertexBuffer)
    pass.setBindGroup(0, bindGroup)
    pass.draw(6, kNumPoints)
    pass.end()

    const commandBuffer = encoder.finish()
    device.queue.submit([commandBuffer])

    requestAnimationFrame(render)
}

requestAnimationFrame(render)
