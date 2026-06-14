struct SceneUniforms { 
    uProjectionMatrix: mat4x4f
};
struct ModelUniforms { 
    uModelViewMatrix: mat4x4f,
    uNormalMatrix: mat4x4f,
};
@group(0) @binding(0) var<uniform> sceneUniforms: SceneUniforms;
@group(1) @binding(0) var<uniform> modelUniforms: ModelUniforms;

struct Transfer {
    @builtin(position) position: vec4f,
    @location(0) color: vec4f
}

@vertex
fn vertex_main(
    @location(0) position: vec3f,
    @location(1) color: vec3f,
) -> Transfer {
    return Transfer(
        sceneUniforms.uProjectionMatrix * modelUniforms.uModelViewMatrix * vec4f(position.xyz, 1),
        vec4f(color.rgb, 1)
    );
}

@fragment
fn fragment_main(in: Transfer) -> @location(0) vec4f {
    return in.color;
}