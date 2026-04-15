// import { cubeData, FLOAT32_SIZE, type VertexData } from './geom-cube'
import { VertexBuffer } from './gl/VertexBuffer'
import { Texture } from "./gl/Texture"
import { Uniform } from './gl/Uniform'
import { mat4, vec3 } from 'gl-matrix'
import { FLOAT32_SIZE, type VertexData } from './geom-cube'
import { IndexBuffer } from './gl/IndexBuffer'

// stuff to investigate
// * resize canvas
// * draw via index
// * hide more boilerplate code

async function shadedCube(device: GPUDevice) {
    // prettier-ignore
    const vertexData = [
        // position       normal
        1, 1, -1, 1, 0, 0,
        1, 1, 1, 1, 0, 0,
        1, -1, 1, 1, 0, 0,
        1, -1, -1, 1, 0, 0,
        -1, 1, 1, -1, 0, 0,
        -1, 1, -1, -1, 0, 0,
        -1, -1, -1, -1, 0, 0,
        -1, -1, 1, -1, 0, 0,
        -1, 1, 1, 0, 1, 0,
        1, 1, 1, 0, 1, 0,
        1, 1, -1, 0, 1, 0,
        -1, 1, -1, 0, 1, 0,
        -1, -1, -1, 0, -1, 0,
        1, -1, -1, 0, -1, 0,
        1, -1, 1, 0, -1, 0,
        -1, -1, 1, 0, -1, 0,
        1, 1, 1, 0, 0, 1,
        -1, 1, 1, 0, 0, 1,
        -1, -1, 1, 0, 0, 1,
        1, -1, 1, 0, 0, 1,
        -1, 1, -1, 0, 0, -1,
        1, 1, -1, 0, 0, -1,
        1, -1, -1, 0, 0, -1,
        -1, -1, -1, 0, 0, -1,
    ]
    // prettier-ignore
    const indices = [
        0, 1, 2, 0, 2, 3, // +x face
        4, 5, 6, 4, 6, 7, // -x face
        8, 9, 10, 8, 10, 11, // +y face
        12, 13, 14, 12, 14, 15, // -y face
        16, 17, 18, 16, 18, 19, // +z face
        20, 21, 22, 20, 22, 23, // -z face
    ]

    // const vertexBuf = createBufferWithData(
    //     device,
    //     vertexData,
    //     GPUBufferUsage.VERTEX,
    //     'vertexBuffer'
    // )
    // const indicesBuf = createBufferWithData(
    //     device,
    //     indices,
    //     GPUBufferUsage.INDEX,
    //     'indexBuffer'
    // )
}

export const cube_XYZ_RGB: VertexData = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: [
        -1, 1, -1, 0, 0, 1,
        1, 1, -1, 0, 0.5, 1,
        1, -1, -1, 0, 1, 0,
        -1, -1, -1, 0.5, 1, 0,

        -1, 1, 1, 1, 0.5, 0,
        1, 1, 1, 1, 0, 0,
        1, -1, 1, 1, 0, 0.5,
        -1, -1, 1, 1, 0, 1
    ],
    vertexCount: 8,
    bytesPerVertex: FLOAT32_SIZE * 6,
    /**
     * offsets within vertex
     */
    layout: {
        POSITION: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        COLOR: { offset: FLOAT32_SIZE * 3, format: 'float32x3' },
        // UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}

export const cube_XYZ: VertexData = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: [
        -1, 1, -1,
        1, 1, -1,
        1, -1, -1,
        -1, -1, -1,

        -1, 1, 1,
        1, 1, 1,
        1, -1, 1,
        -1, -1, 1,
    ],
    vertexCount: 8,
    bytesPerVertex: FLOAT32_SIZE * 3,
    /**
     * offsets within vertex
     */
    layout: {
        POSITION: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        // COLOR: { offset: FLOAT32_SIZE * 3, format: 'float32x3' },
        // UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}

export const cube_RGB: VertexData = {
    /**
     * cube vertices in the format (position: float4, color: float4, uv: float2)
     */
    vertices: [
        0, 0, 1,
        0, 0.5, 1,
        0, 1, 0,
        0.5, 1, 0,

        1, 0.5, 0,
        1, 0, 0,
        1, 0, 0.5,
        1, 0, 1
    ],
    vertexCount: 8,
    bytesPerVertex: FLOAT32_SIZE * 3,
    /**
     * offsets within vertex
     */
    layout: {
        // POSITION: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        COLOR: { offset: FLOAT32_SIZE * 0, format: 'float32x3' },
        // UV: { offset: FLOAT32_SIZE * 8, format: 'float32x2' }
    }
}


enum UniformIndex {
    MODELVIEW = 0,
    NORMAL = 1
}

class Device {
    adapter: GPUAdapter | null = null
    device: GPUDevice | undefined

    async init() {
        this.adapter = await navigator.gpu?.requestAdapter({ featureLevel: 'core' })
        if (this.adapter === null) {
            throw Error('failed to allocate GPUAdapter')
        }
        this.device = await this.adapter?.requestDevice()
        if (this.device === undefined) {
            throw Error('failed to allocate `GPUDevice')
        }
        // uncaught errors
        this.device.addEventListener('uncapturederror', event => console.log(event.error));
    }
}

class Context {
    context: GPUCanvasContext | null = null
    presentationFormat: GPUTextureFormat
    depthTextureFormat: GPUTextureFormat = 'depth24plus'
    depthTexture: GPUTexture
    sampler: GPUSampler

    constructor(device: Device, canvas: HTMLCanvasElement) {
        this.context = canvas.getContext('webgpu')
        if (this.context == null) {
            throw Error('no webgpu')
        }

        const devicePixelRatio = window.devicePixelRatio
        canvas.width = canvas.clientWidth * devicePixelRatio
        canvas.height = canvas.clientHeight * devicePixelRatio
        this.presentationFormat = navigator.gpu.getPreferredCanvasFormat()

        this.context.configure({
            device: device.device!!,
            format: this.presentationFormat,
        })

        this.depthTexture = device.device!!.createTexture({
            size: [canvas.width, canvas.height],
            format: this.depthTextureFormat,
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })

        // Create a sampler with linear filtering for smooth interpolation of the texture
        this.sampler = device.device!.createSampler({
            magFilter: 'linear',
            minFilter: 'linear',
        })

    }
}

class Shader {
    module: GPUShaderModule
    constructor(module: GPUShaderModule) {
        this.module = module
        module.getCompilationInfo().then(info => logCompilationInfo(info))
    }
}

class ShaderShadedMono extends Shader {
    constructor(device: Device) {
        super(
            device.device!.createShaderModule({
                code: /* wgsl */`
                struct SceneUniforms { 
                    uProjectionMatrix: mat4x4f,
                };
                struct ModelUniforms { 
                    uModelViewMatrix: mat4x4f,
                    uNormalMatrix: mat4x4f,
                };
                @group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
                @group(0) @binding(1) var<uniform> modelUniforms: ModelUniforms;
                @group(0) @binding(2) var mySampler: sampler;
                @group(0) @binding(3) var myTexture: texture_2d<f32>;
            
                struct Vertex2Fragment {
                    @builtin(position) Position: vec4f,
                    @location(0) rgb: vec3f
                    // @location(0) fragUV: vec2f,
                    // @location(1) vLighting: vec3f
                }

                @vertex
                fn vertex_main(
                    @location(0) position: vec3f,
                    @location(1) rgb: vec3f
                    // @location(1) normal: vec4f,
                    // @location(2) uv: vec2f
                ) -> Vertex2Fragment {

                    let gl_Position = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4(position, 1);

                    // let ambientLight = vec3f(0.3, 0.3, 0.3);
                    // let directionalLightColor = vec3f(1, 1, 1);
                    // let directionalVector = normalize(vec3f(0.85, 0.8, 0.75));

                    // let transformedNormal = modelUniforms.uNormalMatrix * vec4f(normal.xyz, 1);

                    // let directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
                    // let vLighting = ambientLight + (directionalLightColor * directional);

                    return Vertex2Fragment(
                        gl_Position,
                        rgb
                        // uv,
                        // vLighting
                    );
                }

                @fragment
                fn fragment_main(
                    vin: Vertex2Fragment
                ) -> @location(0) vec4f {
                    // let color = vec3f(1, 0.5, 0);
                    // let color = textureSample(myTexture, mySampler, vin.fragUV).rgb;
                    // return vec4f(color * vin.vLighting, 1);
                    return vec4f(vin.rgb, 1);
                }
            `})
        )
    }
}

class Pipeline {
    pipeline: GPURenderPipeline
    constructor(pipeline: GPURenderPipeline) {
        this.pipeline = pipeline
    }
}

class PipelineShadedMono extends Pipeline {
    constructor(device: Device, module: Shader, context: Context) {
        const pipelineDef: GPURenderPipelineDescriptor = {
            layout: 'auto',
            vertex: {
                buffers: [{
                    arrayStride: cube_XYZ.bytesPerVertex,
                    attributes: [
                        { shaderLocation: 0, ...cube_XYZ.layout.POSITION },
                        // { shaderLocation: 1, ...cube_RGB.layout.COLOR },
                        // { shaderLocation: 1, ...cubeData.layout.NORMAL },
                        // { shaderLocation: 2, ...cubeData.layout.UV },
                    ]
                }, {
                    arrayStride: cube_RGB.bytesPerVertex,
                    attributes: [
                        { shaderLocation: 1, ...cube_RGB.layout.COLOR },
                        // { shaderLocation: 1, ...cube_RGB.layout.COLOR },
                        // { shaderLocation: 1, ...cubeData.layout.NORMAL },
                        // { shaderLocation: 2, ...cubeData.layout.UV },
                    ]
                }],
                module: module.module
            },
            fragment: {
                module: module.module,
                targets: [{ format: context.presentationFormat }]
            },
            primitive: {
                topology: 'triangle-list',
                cullMode: 'none',
            },
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: 'less',
                format: context.depthTextureFormat,
            },
        }

        super(device.device!.createRenderPipeline(pipelineDef))
    }
}

async function main() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (canvas === null) {
        throw Error("#canvas not found")
    }

    const device = new Device()
    await device.init()
    const context = new Context(device, canvas)

    // uniforms shared by all shaders
    // * projection matrix
    // * lights...
    const sceneUniforms = new Uniform(device.device!!, ["mat4x4f"])
    const modelUniforms = new Uniform(device.device!!, ["mat4x4f", "mat4x4f"])

    // Fetch the image and upload it into a GPUTexture.
    const cubeTexture = new Texture()
    await cubeTexture.load(device.device!!, "Di-3d.png")


    //  0     1
    // 3     2
    //
    //  4     5
    // 7     6
    const vertices = new VertexBuffer(device.device!!, cube_XYZ.vertices)
    const colors = new VertexBuffer(device.device!!, cube_RGB.vertices)

    const indices = new IndexBuffer(device.device!!, [
        // top
        0, 1, 2,
        0, 2, 3,
        // left
        0, 3, 7,
        0, 7, 4,
        // back
        1, 0, 4,
        1, 4, 5,
        // front
        3, 2, 6,
        3, 6, 7,
        // right
        1, 5, 6,
        1, 6, 2,
        // bottom
        5, 4, 7,
        5, 7, 6,
    ])
    const module = new ShaderShadedMono(device)
    const shadedTrianglePipeline = new PipelineShadedMono(device, module, context)

    // define the values for shaders '@group(...) @binding(...)' sections
    const bindGroup = device.device!.createBindGroup({
        layout: shadedTrianglePipeline.pipeline.getBindGroupLayout(0),
        entries: [
            { binding: 0, resource: sceneUniforms },
            { binding: 1, resource: modelUniforms },
            { binding: 2, resource: context.sampler },
            { binding: 3, resource: cubeTexture.texture!.createView() },
        ],
    })

    const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
            {
                view: undefined as any, // Assigned later
                clearValue: [0.5, 0.5, 0.5, 1.0],
                loadOp: 'clear',
                storeOp: 'store',
            },
        ],
        depthStencilAttachment: {
            view: context.depthTexture.createView(),
            depthClearValue: 1.0,
            depthLoadOp: 'clear',
            depthStoreOp: 'store',
        },
    }

    let cubeRotation = 0

    // like my OpenGL
    const fieldOfView = (45 * Math.PI) / 180 // in radians
    const aspect = canvas.clientWidth / canvas.clientHeight
    const zNear = 0.1
    const zFar = 100.0
    mat4.perspectiveZO(sceneUniforms.values[0], fieldOfView, aspect, zNear, zFar)
    sceneUniforms.writeTo(device.device!.queue)

    let lastFrameMS = Date.now()

    function frame() {
        const now = Date.now()
        const deltaTime = (now - lastFrameMS) / 1000
        cubeRotation += deltaTime
        lastFrameMS = now

        const modelViewMatrix = modelUniforms.values[UniformIndex.MODELVIEW]
        mat4.identity(modelViewMatrix)
        mat4.translate(modelViewMatrix, modelViewMatrix, vec3.fromValues(0, 0, -6))
        mat4.rotateZ(modelViewMatrix, modelViewMatrix, cubeRotation)
        mat4.rotateY(modelViewMatrix, modelViewMatrix, cubeRotation * 0.7)
        mat4.rotateX(modelViewMatrix, modelViewMatrix, cubeRotation * 0.3)

        const normalMatrix = modelUniforms.values[UniformIndex.NORMAL]
        mat4.invert(normalMatrix, modelViewMatrix)
        mat4.transpose(normalMatrix, normalMatrix)

        // context refers to the canvas!!!
        renderPassDescriptor.colorAttachments[0]!.view = context.context!
            .getCurrentTexture()
            .createView()

        const commandEncoder = device.device!.createCommandEncoder()
        const pass = commandEncoder.beginRenderPass(renderPassDescriptor)
        {
            pass.setPipeline(shadedTrianglePipeline.pipeline)
            {
                modelUniforms.writeTo(device.device!.queue)
                pass.setBindGroup(0, bindGroup)
                pass.setVertexBuffer(0, vertices.buffer)
                pass.setVertexBuffer(1, colors.buffer)
                pass.setIndexBuffer(indices.buffer, 'uint32')
                // pass.draw(testData.vertexCount)
                pass.drawIndexed(indices.length)
            }
            pass.end()
        }
        const commandBuffer = commandEncoder.finish()
        device.device!.queue.submit([commandBuffer])

        requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)

}

main()

async function logCompilationInfo(info: GPUCompilationInfo) {
    for (let m of info.messages) {
        const l = `${m.lineNum}:${m.linePos}: ${m.message}`
        switch (m.type) {
            case "error":
                console.error(l)
                break
            case "warning":
                console.warn(l)
                break
            case "info":
                console.info(l)
                break
        }
    }
}
