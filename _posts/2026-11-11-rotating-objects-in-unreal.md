---
layout: post
title: "Three Ways to Spin a Fan in Unreal Engine"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "Ways to rotate objects and when to use them"
---


## Quick Intro
Rotating an object in any game seems like a trivial thing, right ? weeeeeeell....it is but its very important to know the right way of doing it, and to know the right way of doing it you need to know all the ways to do it and when they apply.
In our example lets take a FAN as our perfect candidate, in this case ill use this free Megascan asset.

<video controls playsinline preload="metadata" aria-label="Fan rotation demo in Unreal Engine" style="display: block; width: 100%; height: auto;">
  <source src="{{ '/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4' | relative_url }}" type="video/mp4">
  <a href="{{ '/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4' | relative_url }}">Watch the fan rotation demo</a>.
</video>

Disclaimer - I'm human and this post is based on my current knowledge as of 11th of Nov 2026.

### Using a Blueprint
#### Blueprint = Update Transforms on Tick
This is one of the most commonly saw tutorials online and while it achieves the result you want by dragging the transforms of the mesh you want to rotate and updating it each tick its expensive.

![Blueprint Event Tick calling Add Actor Local Rotation with a fixed one-degree step]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

This example applies a fixed angle per frame. Multiply your rotation rate in degrees per second by `Delta Seconds` to keep the speed consistent across frame rates.

| Category | In practice |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ Update the actor or component angle every frame. A security camera can track a target and stop at its rotation limits. |
| **Collisions** | ✅ Enabled collision follows the transform. ⚠️ A rotating hazard can miss a contact between frames, so test the blade's path separately if every hit matters. |
| **Pros** | ✅ You control the angle directly, which helps when a turret has to stop exactly at its aim angle. |
| **Cons** | ⚠️ Each active actor runs Blueprint logic and updates a transform every frame. A fixed angle per tick also makes speed depend on frame rate. |
{: .rotation-method-table}

#### Blueprint - Using C++ Rotator component 
This is the current recomended way of rotating an object inside UE

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

| Category | In practice |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ Spins the component you assign. Drive Rotation Rate with a Timeline to ramp up a ventilation fan while its housing stays still. |
| **Collisions** | ✅ Enabled collision rotates with the updated component. ⚠️ Rotation applies without a sweep, so a spinning trap needs separate hit logic if contacts between frames matter. |
| **Pros** | ✅ The built-in component handles continuous spin. A Blueprint switch can change its rate when the player turns a machine on. |
| **Cons** | ⚠️ Each active component still ticks and updates a transform. For a factory full of decorative fans, measure that cost at the instance count you expect to ship. |
{: .rotation-method-table}

### Material - WPO Rotate
WPO was used for a lot of cheap tricks in the past, and its something i personally miss a lot in my day to day work, however with the new pipelines using Nanite WPO is becoming something more expensive than before.

![Unreal material function that normalizes the world-space axis and uses RotateAboutAxis to produce a World Position Offset]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})


| Category | In practice |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The material spins the rendered blades around the hub. ⚠️ Rotate the shading normals as well if the highlights look wrong. |
| **Collisions** | ⚠️ Collision stays at the original pose. That works for an inaccessible rooftop fan, but a player-facing blade hazard needs separate collision or hit logic. |
| **Pros** | ✅ Background fans can spin without per-fan Blueprint Tick or transform updates. |
| **Cons** | ⚠️ WPO adds GPU work. **Avoid WPO on Nanite meshes when possible.** If you need it, profile the GPU cost at your expected fan count and make sure the blade tips stay within the displacement bounds. |
{: .rotation-method-table}

## Conclusions

| Category | Blueprint Tick | Rotating Movement Component | Material WPO |
| --- | --- | --- | --- |
| **Visual** | Rotates the actor or component you target. | Rotates the component you assign. Change its Rotation Rate at runtime to speed up or slow down. | Rotates the rendered vertices around the material pivot. Shading normals may need a matching rotation. |
| **Collision** | Collision follows the transform. A rotation step can miss contacts between frames. | Collision follows the updated component. The rotation step does not sweep for hits. | Collision stays at the original pose. |
| **Performance** | Runs Blueprint logic and updates a transform each frame. | The native component still ticks and updates a transform each frame. | The shader moves the vertices. GPU cost depends on mesh complexity and how many instances are visible. Profile with Nanite enabled if the mesh uses it. |
| **When to use** | You need to calculate the angle yourself, like tracking a target or stopping at a specific angle. | You want continuous spin with a configurable rate, like a fan that ramps up or winds down. | You want purely visual movement, like background fans with stationary collision or no collision. |

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4" %}


/Andrei
