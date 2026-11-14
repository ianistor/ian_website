---
layout: post
title: "Three Ways to Spin a Fan in UE"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "Three ways to spin, and what each means for collision and performance."
---

For decorative fans, I'd start with **material World Position Offset (WPO)**. In my 400-fan test, it stayed close to the static baseline. **Rotating Movement added 3.34 ms to the game-thread frame** versus static, and it can move collision with the blades. **Blueprint Tick** gives me direct control over the angle and gameplay logic. I tested its behavior, but I don't have a timing capture for it.

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4" autoplay=true %}

*Compare how the blades look with how their collision behaves.*

## Choose by what the blades need to do

| Method | When I'd use it | Collision | Measured cost |
| --- | --- | --- | --- |
| [Blueprint Tick](#blueprint-tick) | A puzzle or trap that needs custom control over blade angle | Follows the transform when enabled. Test fast spins for missed contacts. | Unmeasured |
| [Rotating Movement Component](#rotating-movement-component) | Continuous rotation with a rate that gameplay can change | Follows the updated component. The rotation step doesn't sweep for hits. | 3.67 ms/frame in movement ticks for 400 fans |
| [Material WPO](#material-world-position-offset) | Decorative spin | Stays at the mesh's original pose | Close to static in the three-level test. About 0.11 ms/frame of additional VSM rendering in the controlled toggle test. |
{: .rotation-table .fan-method-guide}

## What 400 fans cost

![Game-thread and GPU scene-render times for static, WPO, and component rotation]({{ '/assets/images/blog/rotating-objects-in-unreal/FanBench-Methods-Comparison.png' | relative_url }})

The **static fans are the baseline**. Their game-thread time was **8.36 ms/frame**, versus **8.34 ms/frame** for WPO. That difference was within the variation across capture windows. Component rotation reached **11.70 ms/frame**. GPU scene rendering was **6.32 ms** for static, **6.35 ms** for WPO, and **6.66 ms** for component rotation. Game-thread and GPU work can overlap.

## Blueprint Tick {#blueprint-tick}

Connect **Event Tick** to **Add Actor Local Rotation**. The graph below applies one degree per frame. For steady speed across frame rates, multiply degrees per second by **Delta Seconds**. If the housing stays still, rotate a separate blade component with its pivot at the hub.

![Blueprint Tick calling Add Actor Local Rotation]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

**Cost and evidence.** Each ticking actor runs the Blueprint graph and updates a transform. The screenshot shows the setup. The benchmark covered static, WPO, and native component rotation, so there is no measured Blueprint Tick cost to compare.

## Rotating Movement Component {#rotating-movement-component}

Enable **Rotation in Local Space** and set **Rotation Rate** around the shaft axis. Use **Set Updated Component** to target the blades if they have their own component. A Timeline can change the rate if the fan needs to wind down when the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

**Cost and evidence.** The component runs its tick in C++ and updates the transform every frame. Insights recorded **400 `RotatingMovement` calls per measured frame**. Together they took **3.67 ms/frame** in inclusive game-thread time.

![Unreal Insights Timers showing 98,400 movement calls and 974.7 ms of inclusive CPU time]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Component-Rotation.png' | relative_url }})

*The screenshot shows a full 246-frame selection. Its 974.7 ms total works out to 3.96 ms/frame on average. The benchmark figure uses the median of three trimmed capture-window medians.*

## Material World Position Offset {#material-world-position-offset}

I transform the shaft axis from local space to world space and normalize it before passing it to **RotateAboutAxis**. The pivot is at the hub, and **Time × Speed** drives the angle. The function's displacement goes into **World Position Offset**. Check the shading normals if highlights look wrong as the blades turn.

![Material graph with a normalized world-space axis feeding RotateAboutAxis]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

**Cost and evidence.** The material moves the rendered vertices without ticking a component for each fan. To measure the GPU change, I toggled **Evaluate World Position Offset** on the same 400 components with the camera and material fixed. Nanite's **Evaluate WPO** view confirmed both states. I turned the visualization off before timing.

| GPU metric | WPO on minus off |
| --- | ---: |
| Whole-scene `SceneRender` | +0.07 ms/frame median paired difference, with pair results from −0.16 to +0.64 ms |
| `RenderVirtualShadowMaps` | About +0.11 ms/frame, higher in all four pairs |
| `Shadow.Virtual.ProcessInvalidationsGPU` | About 0.001 ms/frame in both states |
{: .rotation-table}

<details markdown="1">
<summary>View the WPO on/off trace screenshots</summary>

**WPO enabled — `WPO_On_01`**

![Unreal Insights GPU Timers for WPO enabled in the first test pair]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-WPO-On-01.jpg' | relative_url }})

**WPO disabled — `WPO_Off_02`**

![Unreal Insights GPU Timers for WPO disabled in the first test pair]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-WPO-Off-02.jpg' | relative_url }})

*The screenshots show inclusive totals for the first pair. The two shadow-rendering rows together average 0.542 ms/frame with WPO on and 0.457 ms/frame with it off. The 0.11 ms result uses medians across all four pairs.*

</details>

**How much was shadow-cache invalidation?** The scene timing includes Virtual Shadow Map work. The invalidation-processing scope measures marking invalidations. Redrawing pages happens during shadow rendering, which also includes drawing the WPO geometry. I didn't record invalidated-page counts, so the trace can't isolate how much of the shadow-rendering increase came from reduced cache reuse. [Epic's Virtual Shadow Map profiling guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)

## Trace setup and how to read it

I used **Unreal Engine 5.7.3** on a **GeForce RTX 3080** in realtime editor simulation. Each map had the same 20×20 grid of Nanite Megascans fans, a ground plane, and one overhead directional light. I used a fixed camera and recorded the `Cpu`, `Gpu`, `Frame`, and `Region` channels.

| Capture | Timing Regions track | Timers to inspect |
| --- | --- | --- |
| Static baseline | `FanBench_Static_R1` through `R3` | `FEngineLoop::Tick` on `GameThread`, `SceneRender` on `GPU0-Graphics0` |
| Rotating Movement | `FanBench_Component_R1` through `R3` | Same frame timers, plus `RotatingMovement` on `GameThread` |
| Material WPO | `FanBench_WPO_R1` through `R3` | Same frame timers |
| WPO on/off | `WPO_On_01` and `WPO_Off_02` for the screenshot pair | `SceneRender`, `RenderVirtualShadowMaps`, and `Shadow.Virtual.ProcessInvalidationsGPU` on `GPU0-Graphics0` |
{: .rotation-table}

In Timing Insights, select a region and press **Enter** to aggregate timers over that interval. **Count** is the number of timer calls. **Incl** is total inclusive time in the selection. For example, each component-rotation frame contains 400 movement calls.

The three-level chart uses the median of three capture-window medians per variant. The WPO toggle uses four paired 2.5-second windows, trimmed by 0.1 seconds at each end. For shadow rendering, I summed the `RenderVirtualShadowMaps` scopes per frame before taking each window's median.

/Andrei
