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

*Compare how the blades look with how their collision behaves.*

## Which method should I use?

| Use case | What I'd use |
| --- | --- |
| A gameplay puzzle that needs precise control over the blade angle | [Blueprint Tick](#blueprint-tick) |
| A ventilation fan that ramps up when the player flips a switch | [Rotating Movement Component](#rotating-movement-component), with a Timeline to change the rate |
| A spinning trap that must register contact as the blade passes through a player | [Blueprint Tick](#blueprint-tick) or [Rotating Movement Component](#rotating-movement-component) to move the collision with the blades. Test fast spins for missed contacts. |
| Decorative fans whose blades don't need moving collision | [World Position Offset](#material-world-position-offset) when the spin can be visual-only. |
{: .rotation-table .fan-method-guide}

## Context

Rotating an object in a game seems trivial, right? Weeeeeeell… it is, right up until you ask whether the blades should hit anything, whether the player can change the speed, or what happens when you put a hundred of them in a level.

I used a free Megascans fan to try three approaches: Blueprint Tick, Unreal's built-in Rotating Movement Component, and World Position Offset in a material.

`I'm human, and this post is based on what I know as of November 11, 2026.`

## Blueprint Tick {#blueprint-tick}

The quick version is to connect Event Tick to Add Actor Local Rotation. The graph below applies one degree per frame. For a steady speed across frame rates, multiply your rate in degrees per second by Delta Seconds before passing it into the rotation node.

For a fan with a stationary housing, put the blades on their own mesh component and apply the local rotation to that component. Make sure pivot of the mesh is set accordingly otherwise it will rotate from another base.

![Blueprint Tick calling Add Actor Local Rotation with a fixed one-degree step]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The graph controls the rotation applied on each tick. |
| **Collisions** | ✅ Enabled collision follows the transform. ⚠️ The rotation can skip contacts between frames. |
| **Pros** | ✅ You can do any sort of crazy or bespoke logic of the rotation you need |
| **Cons** | ⚠️ Each ticking actor runs the graph and updates a transform every frame. |
{: .rotation-table .rotation-method-table}

## Rotating Movement Component {#rotating-movement-component}

Add a Rotating Movement Component, enable **Rotation in Local Space**, and set **Rotation Rate** on the axis that runs through the shaft. If the housing and blades are separate components, use **Set Updated Component** to target the blades. The component handles the spin, and you can change its rate at runtime. Drive the rate with a Timeline if you want the fan to wind down after the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The assigned component rotates at the rate you set. |
| **Collisions** | ✅ Enabled collision follows the updated component. ⚠️ The rotation step applies without sweeping for hits along the way. |
| **Pros** | ✅ Unreal handles continuous rotation. Blueprint can change the rate whenever gameplay needs it. |
| **Cons** | ⚠️ The component still ticks and updates a transform every frame, however it skips the BP VM. |
{: .rotation-table .rotation-method-table}

### Blueprint Tick vs. Rotating Movement performance

So what am I actually saving by using the Rotating Movement Component? With Blueprint Tick, Unreal runs my graph through the Blueprint VM (virtual machine) every frame before it gets to the actual rotation. The component does that part in C++. Either way, Unreal still has to move the blades and update any attached parts or collision that move with them.

I didn't benchmark Blueprint Tick in the 400-fan test below. The CPU result measures the native Rotating Movement Component, including the work it calls.

## Material World Position Offset {#material-world-position-offset}

I used WPO for a lot of cheap tricks in the past, and I miss that in my day-to-day work. With Nanite in the pipeline, I pay closer attention to what that shader work costs.

I'd start with WPO for decorative fans when the blades don't need moving collision. The cost depends on how much geometry the GPU processes and how much shadow work the animation triggers, so I'd profile it at the fan count and camera distances I expect to ship.

This time the material moves the vertices. In the graph below, I transform the fan's local shaft axis to world space, normalize it, and pass it into **RotateAboutAxis**. I use the blade mesh's pivot at the hub and drive the angle with **Time × Speed**. The function gives me the displacement to plug into **World Position Offset**. If the highlights look wrong as the blades turn, check the shading normals too.

![Material function with a normalized world-space axis feeding RotateAboutAxis]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

| Category | What to expect |
| --- | --- |
| **Visual&nbsp;Updates** | ✅ The rendered blades rotate around the material pivot. |
| **Collisions** | ⚠️ Collision stays at the mesh's original pose while the rendered blades spin. |
| **Pros** | ✅ The animation runs without a per-fan Blueprint Tick or transform update. |
| **Cons** | ⚠️ With Nanite, profile GPU cost at your expected instance count and check that the displacement bounds cover the whole spin. |
{: .rotation-table .rotation-method-table}

## What 400 fans cost

I made three matching levels with 400 copies of the same Nanite Megascans fan in a 20×20 grid, a ground plane, and one directional light pointing straight down. I used the same fixed camera in realtime editor simulation.

| Variant | Game-thread frame | GPU scene render |
| --- | ---: | ---: |
| Static | 8.36 ms | 6.32 ms |
| Material WPO | 8.34 ms | 6.35 ms |
| Rotating Movement Component | 11.70 ms | 6.66 ms |
{: .rotation-table}

![Game-thread and GPU scene-render times for 400 static, WPO, and component-rotated fans]({{ '/assets/images/blog/rotating-objects-in-unreal/FanBench-Methods-Comparison.png' | relative_url }})

Static and WPO had effectively the same game-thread frame time in this run. The 0.02 ms difference was within the variation across capture windows.

The component trace recorded 400 `RotatingMovement` calls per measured frame. Together they took **3.67 ms per frame** in inclusive game-thread time. The game-thread and GPU columns measure work that can overlap.

![Unreal Insights Timers showing 98,400 RotatingMovement calls totaling 974.7 ms inclusive]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Component-Rotation.png' | relative_url }})

*The Timers panel shows the full selection. That works out to 3.96 ms/frame on average over 246 frames. The 3.67 ms figure above uses trimmed capture-window medians.*

### WPO on and off in the same level

I reran the WPO level with the same camera and material, toggling **Evaluate World Position Offset** on the 400 components. Nanite's **Evaluate WPO** visualization showed the fans green with evaluation enabled and red with it disabled. I turned the visualization off before timing.

The median paired difference in GPU `SceneRender` was **+0.07 ms/frame** with WPO on. The four differences ranged from **−0.16 to +0.64 ms/frame**, so the whole-scene change was inconsistent. The combined `RenderVirtualShadowMaps` scopes were **about 0.11 ms/frame higher** with WPO on, with an increase in every pair.

**WPO enabled**

![Unreal Insights GPU Timers for the WPO enabled capture window]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-WPO-On-01.jpg' | relative_url }})

**WPO disabled**

![Unreal Insights GPU Timers for the WPO disabled capture window]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-WPO-Off-02.jpg' | relative_url }})

*The screenshots show inclusive totals for the first pair. Summing the two shadow-rendering rows and dividing by frame count gives 0.542 ms/frame with WPO on and 0.457 ms/frame with WPO off. The 0.11 ms figure uses all four pairs.*

### Did the trace account for shadow-cache invalidation?

Yes. The scene-render timing included Virtual Shadow Map work. `Shadow.Virtual.ProcessInvalidationsGPU` was about **0.001 ms/frame** in both states. That scope processes the invalidations. Rendering shadow pages again happens elsewhere. The shadow-rendering increase includes WPO geometry rendering as well as any additional work from reduced cache reuse. I didn't collect invalidated-page counts, so I can't quantify the cache-invalidation cost on its own. [Epic's Virtual Shadow Map profiling guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)

### Trace setup

- **Engine and hardware** — Unreal Engine 5.7.3, GeForce RTX 3080, realtime editor simulation.
- **Trace channels** — `Cpu`, `Gpu`, `Frame`, and `Region`.
- **Three-level comparison** — Three capture windows per variant. The table shows the median of the window medians. The CPU frame timer was `FEngineLoop::Tick` on `GameThread`. The GPU timer was `SceneRender` on `GPU0-Graphics0`.
- **WPO on/off comparison** — Four paired 2.5-second windows, with 0.1 seconds trimmed from each end of every window. I took per-frame medians within each window and compared the window medians within each pair. For shadow rendering, I summed the `RenderVirtualShadowMaps` scopes per frame before taking the median.

WPO was the cheaper way to spin these decorative fans. If the blades need collision that moves with them, that requirement changes which technique I'd use.

/Andrei
