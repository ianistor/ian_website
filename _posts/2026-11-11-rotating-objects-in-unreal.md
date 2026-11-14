---
layout: post
title: "Three Ways to Spin a Fan in UE"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "Three ways to spin, and what each means for collision and performance."
---

## Why a fan?

Rotating a fan in Unreal sounds easy enough. You make it spin and move on, right? Well… then you ask whether the blades should hit anything, whether the player can change the speed, and what happens if you put 400 of them in a level.

I started with one Megascans fan and tried three ways to spin it. The easiest difference to see is what happens to the collision.

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4" autoplay=true %}

## Okay, what happens with 400 of them?

I made a 20×20 grid with a floor and a directional light pointing straight down. I used the same camera in each test. The static fans gave me something to compare against.

![Nanite Evaluate WPO view of the 400-fan benchmark grid]({{ '/assets/images/blog/rotating-objects-in-unreal/FanBench-Nanite-EvaluateWPO-On.png' | relative_url }})

*The 400-fan grid in Nanite’s Evaluate WPO view. Green shows where Unreal is evaluating WPO. I turned the visualization off for the timing captures.*

| 400 fans | Game thread (ms/frame) | GPU scene render (ms/frame) |
| --- | ---: | ---: |
| Static | 8.33–8.45 | 6.27–6.54 |
| Material WPO | 8.32–8.37 | 6.27–6.37 |
| Rotating Movement | 11.64–12.09 | 6.65–6.73 |
{: .rotation-table}

*Each range is the lowest to highest of three capture-window medians.*

The static and WPO ranges overlap on both the game thread and GPU. The native component stood out on the game thread. Its middle result was **3.34 ms/frame higher than static**. The levels used different materials for static and WPO, and the native component used movable meshes, so I wanted a closer look at the CPU work and a separate test for WPO on the GPU.

## What does it cost to turn the fans on the CPU?

I ran Blueprint Tick and Rotating Movement in the same editor session with 400 fans each. Both traces had 400 rotation calls per measured frame. Here’s what the inclusive median (`I.Med`) looks like in Insights with Timers set to **Game Frame**.

**Rotating Movement — 3.24 ms per game frame**

![Game Frame Timers showing RotatingMovement at 3.24 ms inclusive median]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Component-Matched-Game-Frame.png' | relative_url }})

**Blueprint Tick — 5.24 ms per game frame**

![Game Frame Timers showing the Blueprint actor at 5.24 ms inclusive median]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Blueprint-Game-Frame.png' | relative_url }})

Those rows include the work each tick calls, including the transform update. The whole game thread went from **11.65 ms/frame with Rotating Movement** to **13.80 ms/frame with Blueprint Tick**. That’s about **2.16 ms/frame more** using the unrounded medians. The Blueprint graph turns one degree per tick, while the native component uses degrees per second. The trace measures those two setups as they ran, including the different rotation speeds and transform work.

## What does WPO cost on the GPU?

This was the bit I wanted to poke at. I used the same WPO map, camera and material, and toggled **Evaluate World Position Offset** on the 400 fans. I looked at `RenderVirtualShadowMaps` on the graphics queue. Here’s the timing view for the first pair.

![Unreal Insights GPU0-Graphics0 timeline and shadow timers for the WPO-off window]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-WPO-Off-02.jpg' | relative_url }})

*The screenshot identifies the region and the two shadow-rendering timers. Insights shows inclusive totals for that selection in **Incl**. The table below gives the per-frame timings from the GPU export.*

| Trace regions | WPO on (ms/frame) | WPO off (ms/frame) | Extra with WPO (ms/frame) |
| --- | ---: | ---: | ---: |
| `WPO_On_01` / `WPO_Off_02` | 0.523 | 0.422 | +0.101 |
| `WPO_On_04` / `WPO_Off_03` | 0.526 | 0.419 | +0.108 |
| `WPO_On_05` / `WPO_Off_06` | 0.533 | 0.418 | +0.115 |
| `WPO_On_08` / `WPO_Off_07` | 0.528 | 0.418 | +0.110 |
{: .rotation-table}

Shadow rendering went up in every pair, by about **0.11 ms/frame**. The whole-scene GPU result bounced around more, from **−0.16 to +0.64 ms/frame** across the pairs. The invalidation-processing timer was about **0.001 ms/frame** either way. Unreal redraws pages it can’t reuse during shadow rendering. I didn’t count invalidated pages, so I can’t tell how much of the shadow increase came from cache reuse and how much came from drawing animated geometry. [Epic’s Virtual Shadow Map profiling guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)

## Which one would I use?

### Blueprint Tick {#blueprint-tick}

I'd use this when the angle matters to gameplay and I need custom logic. Connect **Event Tick** to **Add Actor Local Rotation**. The graph here turns one degree each tick. For a steady speed across frame rates, multiply degrees per second by **Delta Seconds**. Collision follows the transform when enabled. For a fast trap, test whether contacts get missed between ticks.

![Blueprint Tick connected to Add Actor Local Rotation]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

### Rotating Movement Component {#rotating-movement-component}

I'd use this for a fan that needs moving collision and a rate I can change. Enable **Rotation in Local Space**, set the rate around the shaft axis, and use **Set Updated Component** if the blades have their own component. A Timeline works for winding the fan down when the power goes out. The rotation step doesn’t sweep for hits.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

### Material World Position Offset {#material-world-position-offset}

For a decorative fan, this is where I'd start. The material moves the rendered vertices and collision stays at the original pose. I feed the normalized world-space shaft axis and the hub pivot into **RotateAboutAxis**, then drive the angle with **Time × Speed**. Check the shading normals if the highlights look off as the blades turn.

![Material graph using RotateAboutAxis to drive World Position Offset]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

<details markdown="1">
<summary>Trace settings and timer names</summary>

I used Unreal Engine **5.7.3** on an **RTX 3080** in realtime editor simulation, with `Cpu`, `Gpu`, `Frame`, and `Region` enabled. The scene timings use `FEngineLoop::Tick` on `GameThread` and `SceneRender` on `GPU0-Graphics0`.

The CPU screenshots cover the intervals spanning the three `FanBench_BP_R*` and `FanBench_Component_R*` regions in the same-session captures. Look for `SM_wcljdev_tier_4_Blueprint_C` and `RotatingMovement`. The whole-game-thread figures use the middle of three window medians, with 0.1 seconds trimmed from each end.

For WPO on/off I used four pairs of 2.5-second windows, trimming 0.1 seconds at both ends. I summed the two `RenderVirtualShadowMaps` scopes per graphics frame before taking the window median. The **Extra with WPO** column uses unrounded values. CPU and GPU work can overlap.

</details>

/Andrei
