---
layout: post
title: "Baking Linear Deformation into Vertex Colors — Houdini to Unreal WPO"
date: 2026-10-03
tags: [houdini, unreal, workflow]
image: "/assets/images/blog/linear-deformation-wpo/material-graph.webp"
excerpt: "Bake an A → B deformation into Vertex Color RGB in Houdini and reconstruct it with World Position Offset in Unreal."
---

<!-- Replace this opening image with the final Unreal result GIF/video when available. -->
![Unreal material graph decoding vertex-color deformation]({{ '/assets/images/blog/linear-deformation-wpo/material-graph.webp' | relative_url }})

## Quick Intro

For simple **State A → State B** mesh deformation, you can bake the vertex movement directly into the mesh instead of relying on bones or Vertex Animation Textures (VAT).

The workflow is straightforward:

**Houdini calculates the vertex offset → stores XYZ in Vertex Color RGB → Unreal reconstructs the deformation using WPO.**

The Houdini side stays procedural, and the Unreal setup is controlled with a single material parameter.

## Houdini

Start with the original mesh and its deformed state. Both need matching topology and point order, so each point refers to the same part of the mesh.

For each point, calculate the difference:

```text
Offset = DeformedPosition - RestPosition
```

Since the offset can contain negative values, encode it into the **0–1 range** used by vertex colors:

```text
EncodedOffset = (Offset / maxDistance) * 0.5 + 0.5
```

Use a positive `maxDistance` large enough to cover every XYZ offset component. `0.5` represents no movement, values below it represent negative movement, and values above it represent positive movement.

Store the result in **Cd / Vertex Color RGB**, then export the **rest mesh** with those colors. In Unreal, import the mesh's vertex colors rather than ignoring or overriding them.

Keep the same encoding range when decoding. The offsets also need to match Unreal's local axes and units: FBX conversion of mesh positions doesn't automatically convert a vector stored as RGB.

## Unreal

On the Unreal side, reverse the process:

```text
LocalOffset = (VertexColor.rgb - 0.5) * (maxDistance * 2)
```

![Unreal material graph decoding vertex-color deformation]({{ '/assets/images/blog/linear-deformation-wpo/material-graph.webp' | relative_url }})

Transform the decoded vector from **Local Space → World Space**, multiply it by `BlendTime`, and connect it to **World Position Offset**.

`BlendTime = 0` → original mesh  
`BlendTime = 1` → fully deformed mesh

Drive it from a Material Instance, Blueprint, Sequencer or Niagara. And that's pretty much it.

## Results

The mesh carries its own deformation data. There are no animation textures or skeletal animation assets, just the baked offsets and the material that reconstructs them.

That doesn't automatically make it faster than VAT or other approaches. WPO cost depends on mesh density, material complexity and rendering path, particularly for **Nanite versus non-Nanite workflows**. Profile it in the context where it will actually be used.

## Pros & Cons

**Pros**

- Simple, procedural Houdini → Unreal pipeline
- Deformation data stays with the mesh
- No additional animation textures
- One blend parameter to expose to gameplay
- Good fit for A → B deformation

**Cons**

- Vertices follow straight paths between states; this doesn't preserve a curved or rotation-driven motion
- Shape quality depends on vertex density, and precision depends on the vertex-color storage and encoding range
- Normals do not update
- Uses RGB channels that may already be needed for other data
- WPO cost needs profiling for Nanite and non-Nanite assets
- Large offsets need appropriate bounds; Nanite also needs attention to its WPO displacement limits
- WPO doesn't update collision to match the deformed surface
- Not a replacement for VAT when you need a multi-frame deformation

## Use Cases

This works best when the deformation can be described as **“move these vertices from here to there.”**

Compressing props, predefined damage states, simple bending and gameplay-driven shape changes are good candidates—as long as the straight-line transition looks right.

Concrete example : Melting candles/props, Engine Thrusters expanding or shrinking (see [Ship Thrusters when accelerating](https://ianistor.com/projects/star-wars-outlaws/environment-art-and-set-dressing/)) or Deflation of air filled props (tires, ballons, etc) 

An optional extension is a **Vertex Alpha mask**: multiply the decoded offset by Alpha before applying the blend. For example, you could vary a panel's deformation strength across its surface. If the mounting points already have zero baked offset, they already stay fixed without an extra mask.

For simple linear deformation, it's a compact workflow that is easy to generate in Houdini and easy to control in Unreal.

/Andrei
