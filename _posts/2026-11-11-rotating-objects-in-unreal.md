---
layout: post
title: "Three Ways to Spin a Fan in UE"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "Three ways to spin, and what each means for collision and performance."
---

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4" autoplay=true %}

*Ignore the transform typo please*

## Context

Rotating an object in a game seems trivial, right? Weeeeeeell… it is, right up until you ask whether the blades should hit anything, whether the player can change the speed, or what happens when you put a hundred of them in a level.

I used a free Megascans fan to try three approaches: Blueprint Tick, Unreal's built-in Rotating Movement Component, and World Position Offset in a material.

`I'm human, and this post is based on what I know as of November 11, 2026.`

## Blueprint Tick

The quick version is to connect Event Tick to Add Actor Local Rotation. The graph below applies one degree per frame. For a steady speed across frame rates, multiply your rate in degrees per second by Delta Seconds before passing it into the rotation node.

For a fan with a stationary housing, put the blades on their own mesh component and apply the local rotation to that component. Make sure pivot of the mesh is set accordingly otherwise it will rotate from another base.

![Blueprint Tick calling Add Actor Local Rotation with a fixed one-degree step]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The graph controls the rotation applied on each tick. |
| **Collisions** | ✅ Enabled collision follows the transform. ⚠️ The rotation can skip contacts between frames. |
| **Pros** | ✅ You can calculate the angle yourself and clamp it, steer toward a target, or stop at a specific orientation. |
| **Cons** | ⚠️ Each ticking actor runs the graph and updates a transform every frame. |
{: .rotation-table .rotation-method-table}

## Rotating Movement Component

Add a Rotating Movement Component, enable **Rotation in Local Space**, and set **Rotation Rate** on the axis that runs through the shaft. If the housing and blades are separate components, use **Set Updated Component** to target the blades. The component handles the spin, and you can change its rate at runtime. Drive the rate with a Timeline if you want the fan to wind down after the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The assigned component rotates at the rate you set. |
| **Collisions** | ✅ Enabled collision follows the updated component. ⚠️ The rotation step applies without sweeping for hits along the way. |
| **Pros** | ✅ Unreal handles continuous rotation. Blueprint can change the rate whenever gameplay needs it. |
| **Cons** | ⚠️ The component still ticks and updates a transform every frame. |
{: .rotation-table .rotation-method-table}

### Blueprint Tick vs. Rotating Movement performance

So what am I actually saving by using the Rotating Movement Component? With Blueprint Tick, Unreal runs my graph through the Blueprint VM (virtual machine) every frame before it gets to the actual rotation. The component does that part in C++. Either way, Unreal still has to move the blades and update any attached parts or collision that move with them.

For one fan and a couple of nodes, I doubt any performance spikes will be seen, however the situation is a bit different if we have a warehouse full of them or plenty of them on screen.

## Material World Position Offset

I used WPO for a lot of cheap tricks in the past, and I miss that in my day-to-day work. With Nanite in the pipeline, I pay closer attention to what that shader work costs.

This time the material moves the vertices. In the graph below, I transform the fan's local shaft axis to world space, normalize it, and pass it into **RotateAboutAxis**. I use the blade mesh's pivot at the hub and drive the angle with **Time × Speed**. The function gives me the displacement to plug into **World Position Offset**. If the highlights look wrong as the blades turn, check the shading normals too.

![Material function with a normalized world-space axis feeding RotateAboutAxis]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The rendered blades rotate around the material pivot. |
| **Collisions** | ⚠️ Collision stays at the mesh's original pose while the rendered blades spin. |
| **Pros** | ✅ The animation runs without a per-fan Blueprint Tick or transform update. |
| **Cons** | ⚠️ **Avoid WPO on Nanite meshes when possible.** If you need it, profile GPU cost at your expected instance count and check that the displacement bounds cover the whole spin. |
{: .rotation-table .rotation-method-table}

## Conclusions

| Use case | What to use |
| --- | --- |
| A gameplay fan puzzle | **Blueprint Tick** gives you direct control over the angle,limits,speed and axis in realtime |
| A ventilation fan that ramps up when the player flips a switch | **Rotating Movement Component** handles the spin while a Timeline changes its rate. |
| A spinning trap that must register hits as the blade passes through a player |**Blueprint Tick or Component**  |
| Rooftop fans that players only see from a distance | **WPO** is an option for visual-only spin. For Nanite meshes I'd start with transform rotation and measure at the fan count I expect to ship. |

**Funny enough testing performances in traces shows WPO is still the clear winner performance wise, even if Nanite is on. (will share more data analysis soon)**

{: .rotation-table}





/Andrei
