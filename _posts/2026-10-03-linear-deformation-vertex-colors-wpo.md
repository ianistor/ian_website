---
layout: post
title: "Baking Linear Deformation into Vertex Colors — Houdini to Unreal WPO"
date: 2026-10-03
tags: [houdini, unreal, workflow]
image: "/assets/images/blog/linear-deformation-wpo/material-graph.webp"
excerpt: "Bake an A → B deformation into Vertex Color RGB in Houdini and reconstruct it with World Position Offset in Unreal."
---

<video controls playsinline preload="metadata" aria-label="Wall deformation using baked vertex colors and Unreal World Position Offset" style="display: block; width: 100%; height: auto;">
  <source src="{{ '/assets/videos/blog/linear-deformation-wpo/BlendshapeWallDeform2.mp4' | relative_url }}" type="video/mp4">
  Your browser does not support embedded video. <a href="{{ '/assets/videos/blog/linear-deformation-wpo/BlendshapeWallDeform2.mp4' | relative_url }}">Watch the wall deformation video</a>.
</video>

## Quick Intro

For simple **State A → State B** mesh deformation, you can bake the vertex movement directly into the mesh instead of relying on bones or Vertex Animation Textures (VAT).

The workflow is straightforward:

**Houdini calculates the vertex offset → stores XYZ in Vertex Color RGB → Unreal reconstructs the deformation using WPO.**

The Houdini side stays procedural, and the Unreal setup is controlled with a single material parameter.

## Houdini

Start with the original mesh and its deformed state. Both need matching topology and point order, so each point refers to the same part of the mesh.

![Houdini network with og_mesh, deformed_mesh, find_max_val and set_cd wrangles]({{ '/assets/images/blog/linear-deformation-wpo/houdini-network.webp' | relative_url }})

### find_max_val — Run Over: Detail (only once)

Connect **og_mesh to input 0** and **deformed_mesh to input 1**. This wrangle finds the largest absolute displacement component across X, Y and Z and stores it as `max_diff_val`.

```c
// OG mesh in input 0, deformed in 1
float max_val = 0.0;

int npts = npoints(0);
for (int i = 0; i < npts; i++) {
    vector posA = point(0, "P", i);
    vector posB = point(1, "P", i);
    vector diff = posA - posB;

    max_val = max(max_val, abs(diff.x));
    max_val = max(max_val, abs(diff.y));
    max_val = max(max_val, abs(diff.z));
}

setdetailattrib(0, "max_diff_val", max_val, "set");
```

The sign doesn't matter for this step because we're measuring absolute values. One shared maximum gives every point the same encoding range.

### set_cd — Run Over: Points

Connect **find_max_val to input 0** and **deformed_mesh to input 1**. Here the direction matters: use **deformed − original** so a positive `BlendTime` moves the exported rest mesh towards its deformed state.

```c
vector diff = point(1, "P", @ptnum) - @P;
float max_val = detail(0, "max_diff_val", 0);

// Encode signed displacement into the 0-1 color range.
// Identical meshes have no displacement, so avoid dividing by zero.
@Cd = set(0.5, 0.5, 0.5);
if (max_val > 0.0) {
    diff /= (max_val * 2.0);
    @Cd = diff + 0.5;
}

// Store the Unreal value separately; Houdini units here are metres.
if (@ptnum == 0) {
    setdetailattrib(0, "max_diff_val_unreal", max_val * 100.0, "set");
}
```

RGB now stores the XYZ offset: `0.5` represents no movement, values below it represent negative movement, and values above it represent positive movement.

The `× 100` converts metres to Unreal's centimetres. It assumes the mesh is exported with the same metre-to-centimetre conversion; adjust this factor if your pipeline uses different units. Copy **max_diff_val_unreal** from the Geometry Spreadsheet's Detail view into the material's **maxDistance** parameter. This custom detail attribute isn't automatically connected to the material.

Export the **rest mesh** with its baked colors. In Unreal, import those vertex colors rather than ignoring or overriding them.

## Unreal

On the Unreal side, first **swizzle RGB to RBG**, as shown by the **Make Vector3** node in the graph, then reverse the encoding:

```text
LocalOffset = (VertexColor.rbg - 0.5) * (maxDistance * 2)
```

![Unreal material graph decoding vertex-color deformation]({{ '/assets/images/blog/linear-deformation-wpo/material-graph.webp' | relative_url }})

### Material Function setup

Houdini uses **Y-up**, while Unreal uses **Z-up**. In this setup, the baked Houdini XYZ displacement needs to become Unreal XZY:

That's why **Make Vector3** receives **R, B, G**. A vertical movement stored in Houdini's green channel must drive Unreal's Z axis.

The mesh import handles the geometry's coordinate conversion, but RGB travels as color data—the importer doesn't know it contains a displacement vector. We perform that conversion ourselves. This swizzle matches the setup shown; it must agree with your export/import axis settings. If you already converted the offsets before baking them, don't swap them again.

Transform the decoded vector from **Local Space → World Space**, multiply it by `BlendTime`, and connect it to **World Position Offset**.

`BlendTime = 0` → original mesh  
`BlendTime = 1` → fully deformed mesh

Drive it from a Material Instance, Blueprint, Sequencer or Niagara. And that's pretty much it.

## Results

The mesh carries its own deformation data. There are no animation textures or skeletal animation assets, just the baked offsets and the material that reconstructs them.

That doesn't automatically make it faster than VAT or other approaches. WPO cost depends on mesh density, material complexity and rendering path, particularly for **Nanite versus non-Nanite workflows**. Profile it in the context where it will actually be used.

<style>
#pros--cons + table th + th,
#pros--cons + table td + td {
  border-left: 1px solid #6b7280;
  padding-left: 1rem;
}
#pros--cons + table th:first-child,
#pros--cons + table td:first-child {
  padding-right: 1rem;
}
</style>

## Pros & Cons

| Pros | Cons |
| --- | --- |
| Simple, procedural Houdini → Unreal pipeline | Vertices follow straight paths between states; this doesn't preserve a curved or rotation-driven motion |
| Deformation data stays with the mesh | Shape quality depends on vertex density, and precision depends on the vertex-color storage and encoding range |
| No additional animation textures | Normals do not update |
| One blend parameter to expose to gameplay | Uses RGB channels that may already be needed for other data |
| Good fit for A → B deformation | WPO cost needs profiling for Nanite and non-Nanite assets |
| — | Large offsets need appropriate bounds; Nanite also needs attention to its WPO displacement limits |
| — | WPO doesn't update collision to match the deformed surface |
| — | Not a replacement for VAT when you need a multi-frame deformation |

## Use Cases

This works best when the deformation can be described as **“move these vertices from here to there.”**

Compressing props, predefined damage states, simple bending and gameplay-driven shape changes are good candidates—as long as the straight-line transition looks right.

Concrete example : Melting candles/props, Engine Thrusters expanding or shrinking (see [Ship Thrusters when accelerating](https://ianistor.com/projects/star-wars-outlaws/procedural-animation-trailblazer/)) or Deflation of air filled props (tires, ballons, etc) 

For simple linear deformation, it's a compact workflow that is easy to generate in Houdini and easy to control in Unreal.

/Andrei
