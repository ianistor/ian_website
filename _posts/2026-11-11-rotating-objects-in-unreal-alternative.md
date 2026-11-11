---
layout: post
title: "Three Ways to Spin a Fan in Unreal Engine (Alternate)"
hidden: true
permalink: /blog/2026/11/11/rotating-objects-in-unreal/alternate/
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "One fan, three ways to spin it, and what each means for collision and performance."
---

[Read the original version]({{ '/blog/2026/11/11/rotating-objects-in-unreal/' | relative_url }})

## Quick intro

Making a fan spin in Unreal sounds trivial. And it is, right up until you ask whether the blades should hit anything, whether the player can change the speed, or what happens when you put a hundred of them in a level.

I used a free Megascans fan to try three approaches: Blueprint Tick, Unreal's built-in Rotating Movement Component, and World Position Offset in a material.

<video controls playsinline preload="metadata" aria-label="Fan rotation demo in Unreal Engine" style="display: block; width: 100%; height: auto;">
  <source src="{{ '/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4' | relative_url }}" type="video/mp4">
  <a href="{{ '/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4' | relative_url }}">Watch the fan rotation demo</a>.
</video>

## Blueprint Tick

The quick version is to connect Event Tick to Add Actor Local Rotation. The graph below applies one degree per frame. For a steady speed across frame rates, multiply your rate in degrees per second by Delta Seconds before passing it into the rotation node.

For a fan with a stationary housing, put the blades on their own mesh component and apply the local rotation to that component. Check that the blade pivot is at the hub.

![Blueprint Tick calling Add Actor Local Rotation with a fixed one-degree step]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The graph controls the rotation applied on each tick. |
| **Collisions** | ✅ Enabled collision follows the transform. ⚠️ The rotation can skip contacts between frames. |
| **Pros** | ✅ You can calculate the angle yourself and clamp it, steer toward a target, or stop at a specific orientation. |
| **Cons** | ⚠️ Each ticking actor runs the graph and updates a transform every frame. |
{: .rotation-method-table}

## Rotating Movement Component

Add a Rotating Movement Component, enable **Rotation in Local Space**, and set **Rotation Rate** on the axis that runs through the shaft. If the housing and blades are separate components, use **Set Updated Component** to target the blades. The component handles the spin, and you can change its rate at runtime. Drive the rate with a Timeline if you want the fan to wind down after the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The assigned component rotates at the rate you set. |
| **Collisions** | ✅ Enabled collision follows the updated component. ⚠️ The rotation step applies without sweeping for hits along the way. |
| **Pros** | ✅ Unreal handles continuous rotation. Blueprint can change the rate whenever gameplay needs it. |
| **Cons** | ⚠️ The component still ticks and updates a transform every frame. |
{: .rotation-method-table}

## Material World Position Offset

This time the material moves the vertices. In the graph below, I transform the fan's local shaft axis to world space, normalize it, and pass it into **RotateAboutAxis**. I use the blade mesh's pivot at the hub and drive the angle with **Time × Speed**. The function gives me the displacement to plug into **World Position Offset**. If the highlights look wrong as the blades turn, check the shading normals too.

![Material function with a normalized world-space axis feeding RotateAboutAxis]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The rendered blades rotate around the material pivot. |
| **Collisions** | ⚠️ Collision stays at the mesh's original pose while the rendered blades spin. |
| **Pros** | ✅ The animation runs without a per-fan Blueprint Tick or transform update. |
| **Cons** | ⚠️ **Avoid WPO on Nanite meshes when possible.** If you need it, profile GPU cost at your expected instance count and check that the displacement bounds cover the whole spin. |
{: .rotation-method-table}

## Conclusions

Play both clips and drag the divider. **Collision** is on the left and **Visual update** is on the right.

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4" %}

| Use case | Where I'd start |
| --- | --- |
| A security camera that follows the player and stops at a yaw limit | **Blueprint Tick** gives me direct control over the angle and its limits. |
| A ventilation fan that ramps up when the player flips a switch | **Rotating Movement Component** handles the spin while a Timeline changes its rate. |
| A spinning trap that must register hits as the blade passes through a player | I'd drive the blade transform and add a gameplay hit check that covers the space between rotation steps. |
| Rooftop fans that players only see from a distance | **WPO** is an option for visual-only spin. For Nanite meshes I'd start with transform rotation and measure at the fan count I expect to ship. |

For a performance comparison, I'd capture Game Thread and GPU time in Unreal Insights with the same mesh, camera, and fan count. I'd start with stationary fans, then repeat for each method.

/Andrei
