[ ] tweak all rendering modes to be correct (so that i can see the lines on the morph heat map)
[ ] assign material to groups, don't draw groups without material (to clean up the render)
    NOTE: it might be easier to split a Wavefront file with groups into multiple meshes...
          but then Blender also support assigning multiple materials to a single mesh...
          also: internally the code should be compatible with USD, meaning instead of
          Wavefront's subgroup ranges, we'd need sets of indices.
          *sigh* this makes stuff tricky: again, i should begin to TDD it before it gets
          out of control
[ ] marking points/edges would be great (via vertex group?) to assist laying out one mesh
    onto the other
[ ] maybe instead of splitting the mesh for the morph, i could implement a deform mesh???
    the deform mesh would need to modes: edit the deform mesh and deform the deform mesh
    ^ THIS LOOKS LIKE A GREAT IDEA AS OF NOW
    (as adjusting each morph separatly may lead to inconsitencies anyway)

### for IndyGL

[X] outline of textured mesh rendered wrong
    because: all selected meshes must be rendered first
[X] use mat.getRotation() to calculate the normlas
[ ] scaling is currently done in local coordinates
[ ] support global and local transformations
[ ] use axis constraint keys to cycle through
    no constraint -> global -> local -> no constraint
[ ] there is some bug when leaving TupleElementInput
    (not sure yet how to reproduce)
[ ] copy'n paste by hovering over TupleElementInput
[ ] modify more than one tuple element by selecting
    multiple of them via drag up/down
[ ] menubar
[ ] undo/redo

[ ] viewport shading solid x-ray
[ ] opengl shadows

[ ] re-enable edit mode
  [ ] render
  [ ] select points

### for makehuman.js

[ ] persist node tree and transforms
    (using the filename in Mesh)
[ ] add BlendShape to node tree (see TODO in loadBlendshapes() for details)
[ ] switch Selection to XForm and add utility methods to IndyNode
    this means that i'll have to touch all grab/rotate/scale controllers
[ ] select XForm when XForm child is selected and open appropiate property editor
[ ] blendshape editor
  [ ] render a single blendshape

### next steps
change to the outliner (as with the new xform selected it feels weird)
 [ ] use the dark blue for both active and selected
 [ ] use the light blue for the clicked item (state tracked inside outliner)
     for now have only one selected item

// [ ] grab with constraint to line ain't right (unstable as algorithm projects to plane, not line)
// [ ] also show in outliner
//   [ ] Material
//   [ ] Vertex Groups
// [ ] Select the XForm
// [ ] keyboard navigation
// [ ] space bar to select (different from blender)
// ...
// WAIT! I AM LOOSING TRACK OF THE BLENDSHAPE EDITOR
// => add the show/hide buttons
//    (that's why i started this)
// => change Selection to use Xform instead of Mesh
//    (just so that i have to change fewer code in the future)
// => how are blendshapes shown in blender?
// => come up with a design suitable for the blendshape editor
// => implement it
// => continue with the editor
//   => save ()