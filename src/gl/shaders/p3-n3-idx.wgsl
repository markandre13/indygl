struct SceneUniforms { 
    uProjectionMatrix: mat4x4f
};
struct ModelUniforms { 
    uModelViewMatrix: mat4x4f,
    uNormalMatrix: mat4x4f,
};
struct ColorUniforms {
    uColor: vec4f
}
@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;
@group(2) @binding(0) var<uniform> colorUniforms: ColorUniforms;

struct Vertex2Fragment {
    @builtin(position) Position: vec4f,
    @location(0) vLighting: vec3f
}

@vertex
fn vertex_main(
    @location(0) position: vec4f,
    @location(1) normal: vec4f,
) -> Vertex2Fragment {

    let gl_Position 
        = sceneUniforms.uProjectionMatrix 
        * modelUniforms.uModelViewMatrix 
        * position;

    let ambientLight = vec3f(0.3, 0.3, 0.3);
    let directionalLightColor = vec3f(1, 1, 1);
    let directionalVector = normalize(vec3f(0.85, 0.8, 0.75));

    let transformedNormal = modelUniforms.uNormalMatrix * vec4f(normal.xyz, 1);

    let directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
    let vLighting = ambientLight + (directionalLightColor * directional);

    return Vertex2Fragment(
        gl_Position,
        vLighting
    );
}

@fragment
fn fragment_main(
    vin: Vertex2Fragment
) -> @location(0) vec4f {
    return vec4f(colorUniforms.uColor.xyz * vin.vLighting, colorUniforms.uColor.w);
}