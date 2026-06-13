// based on https://www.youtube.com/watch?v=RqrkVmj-ntM
// based on 
// 3D Graphics Rendering Cookbook: A comprehensive guide to exploring rendering algorithms in modern OpenGL and Vulkan
// Sergey Kosarevsky, Viktor Latypov
// Packt Publishing 2021

// this one is more artistic: https://github.com/toji/pristine-grid-webgpu
// this one is what i'd like to have: https://www.threejs-blocks.com/docs/GridPristine

struct SceneUniforms { 
    projection: mat4x4f,
    camera: vec4f
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;

const s = 50;
const h = 0;

const pos = array(
    vec3f(-s, h, -s),
    vec3f( s, h, -s),
    vec3f( s, h,  s),
    vec3f(-s, h,  s)
);

const indices = array(0, 2, 1, 2, 0, 3);

const gridCellSize: f32 = 1;
const gridColorThin = vec4f(0.35, 0.35, 0.35, 1.0);
const gridColorThick = vec4f(1, 1, 1, 1.0);

struct Transfer {
    @builtin(position) position: vec4f,
    @location(0) worldPos: vec4f
}

fn euclidean_modulo(n: f32, m: f32) -> f32 {
    return (( n % m ) + m ) % m;
}

@vertex
fn vertex_main(@builtin(vertex_index) vertexIndex: u32) -> Transfer {
    let index = indices[vertexIndex];
    var position = vec4f(pos[index], 1.0);

    // shift rectangle to be close to the camera
    position.x += scene.camera.x - euclidean_modulo(scene.camera.x, s / 10);
    position.z += scene.camera.z - euclidean_modulo(scene.camera.z, s / 10);

    return Transfer(scene.projection * position, position);
}

@fragment
fn fragment_main(in: Transfer) -> @location(0) vec4f {
    let scaledPos = in.worldPos.xz / gridCellSize;

    let grid = abs(fract(scaledPos - 0.5) - 0.5) / fwidth(scaledPos);
    let line = min(grid.x, grid.y);
    
    // Mix grid line color (black) with transparent/ground color
    let a = 1.0 - min(line, 1.0);
  
    let camera = vec2f(scene.camera.x, scene.camera.z);
    let here = in.worldPos.xz;
    let d = distance(camera, here);
    let depthFade = 1 - clamp(d / s, 0.0, 1.0);

    return vec4f(gridColorThin.rgb, a * depthFade);
}