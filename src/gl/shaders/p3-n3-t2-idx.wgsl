struct SceneUniforms { 
    uProjectionMatrix: mat4x4f,
};
struct ModelUniforms { 
    uModelViewMatrix: mat4x4f,
    uNormalMatrix: mat4x4f,
};
@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
@group(2) @binding(0) var mySampler: sampler;
@group(2) @binding(1) var myTexture: texture_2d<f32>;

struct Vertex2Fragment {
    @builtin(position) Position: vec4f,
    @location(0) fragUV: vec2f,
    @location(1) vLighting: vec3f
}

@vertex
fn vertex_main(
    @location(0) position: vec3f,
    @location(1) normal: vec3f,
    @location(2) uv: vec2f
) -> Vertex2Fragment {

    let gl_Position = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4f(position.xyz, 1);

    let ambientLight = vec3f(0.3, 0.3, 0.3);
    let directionalLightColor = vec3f(1, 1, 1);
    let directionalVector = normalize(vec3f(0.85, 0.8, 0.75));

    let transformedNormal = modelUniforms.uNormalMatrix * vec4f(normal.xyz, 1);

    let directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    let vLighting = ambientLight + (directionalLightColor * directional);

    return Vertex2Fragment(
        gl_Position,
        uv,
        vLighting
    );
}

@fragment
fn fragment_main(
    vin: Vertex2Fragment
) -> @location(0) vec4f {
    // let color = vec3f(1, 0.5, 0);
    let color = textureSample(myTexture, mySampler, vin.fragUV).rgb;
    return vec4f(color * vin.vLighting, 1);
}