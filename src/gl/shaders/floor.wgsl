// this one is more artistic: https://github.com/toji/pristine-grid-webgpu
// this one is what i'd like to have: https://www.threejs-blocks.com/docs/GridPristine
// the fragment shader began with something Google AI suggested
// i fixed the depth fade and added fine and coarse lines
// TODO: this should also draw the ground axes...

struct SceneUniforms { 
    projection: mat4x4f,
    camera: vec4f
};

@group(0) @binding(0) var<uniform> scene: SceneUniforms;

// floor size (s x s)
const s = 100;
// floor height
const h = 0;

// floor vertices
const pos = array(
    vec3f(-s, h, -s),
    vec3f( s, h, -s),
    vec3f( s, h,  s),
    vec3f(-s, h,  s)
);

// floor indices (two triangles)
const indices = array(0, 2, 1, 2, 0, 3);

const gridCellSize: f32 = 1;
const gridColorFine = vec4f(0.35, 0.35, 0.35, 1.0);
const gridColorCoarse = vec4f(0.5, 0.5, 0.5, 1.0);
const gridColorAxisX = vec4f(1, 0.35, 0.35, 1.0);
const gridColorAxisY = vec4f(0.35, 1, 0.35, 1.0);
const gridColorAxisZ = vec4f(0.35, 0.35, 1, 1.0);

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
    let scaledPosFine = in.worldPos.xz / gridCellSize;
    let gridFine = abs(fract(scaledPosFine - 0.5) - 0.5) / fwidth(scaledPosFine);
    let lineFine = min(gridFine.x, gridFine.y);
    let aFine = 1.0 - min(lineFine, 1.0);

    let scaledPosCoarse = in.worldPos.xz / gridCellSize / 10;
    let gridCoarse = abs(fract(scaledPosCoarse - 0.5) - 0.5) / fwidth(scaledPosCoarse);
    let lineCoarse = min(gridCoarse.x, gridCoarse.y);
    let aCoarse = 1.0 - min(lineCoarse, 1.0);

    // fade out far away grid
    let camera = vec2f(scene.camera.x, scene.camera.z);
    let here = in.worldPos.xz;
    let d = distance(camera, here);
    let depthFade = 1 - clamp(d / s, 0.0, 1.0);

    if(aCoarse > 0.1) {
        if (abs(in.worldPos.x) < 0.1) {
            return vec4f(gridColorAxisX.rgb, aFine * depthFade);
        }
        if (abs(in.worldPos.z) < 0.1) {
            return vec4f(gridColorAxisZ.rgb, aFine * depthFade);
        }
        return vec4f(gridColorCoarse.rgb, aFine * depthFade);
    }
    return vec4f(gridColorFine.rgb, aFine * depthFade);
}