struct SceneUniforms { 
    uProjectionMatrix: mat4x4f,
};
struct ModelUniforms { 
    uModelViewMatrix: mat4x4f,
    uNormalMatrix: mat4x4f,
};
@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;

struct Vertex2Fragment {
    @builtin(position) Position: vec4f,
    @location(0) rgba: vec4f
}

@vertex
fn vertex_main(
    @location(0) position: vec3f,
    @location(1) rgb: vec3f
) -> Vertex2Fragment {
    let pos = sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4(position, 1);
    return Vertex2Fragment(pos, vec4(rgb, 1));
}

@fragment
fn fragment_main(
    vin: Vertex2Fragment
) -> @location(0) vec4f {
    return vin.rgba;
}