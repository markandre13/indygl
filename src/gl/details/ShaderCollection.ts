import type { Context } from '../Context'
import { ShaderP3_N3_IDX } from '../shaders/ShaderP3_N3_IDX'

// [ ] make rendering more generic: like a mesh object?
//     https://graphics.cs.utah.edu/teapot/
//     https://en.wikipedia.org/wiki/Utah_teapot
//
//  [ ] have cube, human and teapot a the same time
//  [ ] select object with pointer
//  [ ] move object with pointer
//
// blender tree:
//   Scene Collection (name can't be changed)
//     Collection
//       Camera
//         Camera
//       Cube
//         Cube
//           Material
//       Light
//         Light
// usd tree
//   Xform root (UsdGeomXform)
//     Xform Cube ;; custom string userProperties:blender:object_name = "Cube"
//       Mesh     ;; custom string userProperties:blender:data_name = "Cube"
//         UsdGeomMesh
//   Scope
//     Material
//       Shader
//   DomeLight
//
// https://docs.blender.org/manual/en/2.80/modeling/meshes/editing/edges.html
// * Seams are a way to create separations, “islands”, in UV maps.
// * Crease: This edge property, a value between (0.0 to 1.0), is used by the 
//   Subdivision Surface Modifier to control the sharpness of the edges in the
//   subdivided mesh.
// * Sharp: exlude from smooth shading
// * Bevel weight
// For editing
// slide (move edge using constraints), rotate (rotate edge and create new points), splice, bridge (connect groups of points)
// USD and WavefrontObj have similar data structures for meshes
//
// faceVertexCounts: int[]      vcount
// faceVertexIndices: int[]     fxyz
// normals: normal3f[]          normal
// points: point3f[]            xyz
// primvars:st: texCoord2f[]    uv
// primvars:st:indices: int[]   fuv
//
// but for editing i will need my own internal data format
//
// face:
//    flat/smooth
//    material <- that's the one we want to distinguish teeth and gum
// edges:
//    sharp <-- that's the one we want for fingernails
//    seam
//    ...
//
// ./source/blender/bmesh/bmesh.hh
// loops: https://docs.blender.org/manual/en/latest/modeling/meshes/selecting/loops.html
// class BMesh {
//   BMVert {
//      float co[3] // vertex coordinate
//      float no[3] // vertex normal
//   }
//   BMEdge {
//      v1, v2
//   }
//     edge/vert/face/loop
// }
// add some ui element from blender and extend toad.js with a blender like style for that (smaller ui elements)
// could write a screenshot test for that in toad.js too!!!
// next steps:
// [ ] update vertex buffer
// [X] draw lines
// [X] pick points
// [ ] transformation pipelines
// [X] rotate, fly mode
// for the rest: try to build something usable for the morph editor.
// [ ] import some meshes
// [ ] edit mode: mesh symmetry: x, y, z
// [ ] select via click, circle, rectangle
// mimic some more things from the blender ui:
// [ ] wireframe, solid, 
// [ ] x-ray
// [ ] interaction mode: object, edit, ...
// [ ] select mode: vertex, line, face
// [ ] draw ground
/*
blender starts with solid
           object                                          edit
wireframe  orange edges, gray, not shaded, not smooth    + edges, points, faces
solid:     orange outline, gray, shaded, smooth          + edges, points, faces (depthbuffer disabled? not quite? hidden e&p have another color)

X render subset (subset operator? later...) we need the subset to test transparency
X do the transparent stuff
X smooth shading
X transform using the panel on the right
[ ] panel: propper styles for headings
[X] fix select point (location is of)
[ ] select multiple tuple elements

[ ] nicer api for SpringLayout
[ ] propper tests for SpringLayout
[X] edges aren't completly visible (persist camera position to debug this)
[X] status bar icons for mouse buttons and special keys
[X] texture
[ ] draw ground
[ ] draw axis

[ ] menubar (via toad styles: big and small)
[ ] undo/redo
[ ] two objects (MH & ARKit neutral)
*/
export class ShaderCollection {
    // readonly p3_idx: ShaderP3_IDX
    readonly p3_n3_idx: ShaderP3_N3_IDX
    // readonly p3_n3_idx_alpha: ShaderP3_N3_IDX_Alpha
    constructor(context: Context) {
        const device = context.device
        this.p3_n3_idx = new ShaderP3_N3_IDX(device, context)
        // this.p3_n3_idx_alpha = new ShaderP3_N3_IDX_Alpha(device, context)
        // // const shaderPickPoint = new ShaderP3_PickPoint(device, context)
        // const shaderPickPoints = new ShaderP3_C3_Point(device, context)
        // this.p3_idx = new ShaderP3_IDX(device, context)
        // // const shaderColor = new ShaderP3_C3_IDX(device, context)
        // const shaderShadedTexture = new ShaderP4N4T2(device, context)
        // const shaderShadedTexture2 = new ShaderP3_N3_T2(device, context)
        // const shaderShadedTexture3 = new ShaderP3_N3_T2_IDX(device, context)
        // // const shaderShadedMono = new ShaderP3N3(device, context)
        // const shaderLines = new ShaderP3_C3_IDX_LineList(device, context) // need ShaderP3_C3_IDX_LineList
    }
}
