---
layout: post
title: "Three Ways to Spin a Fan in Unreal Engine"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/fan-collision-and-visual.jpg"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "Blueprint Tick, Rotating Movement Component, and World Position Offset compared for collision and performance with 400 Nanite fans."
---

I spun the same Megascans fan three ways in Unreal Engine, then tested each approach with 400 fans. Here’s what I’d use when gameplay needs precise blade angles, when a fan just needs to change speed, and when a scene is full of decorative fans.

<style>
.fan-trace > summary {
  cursor: pointer;
}
.fan-trace > summary .fan-trace-icon {
  display: inline-block;
  margin-inline-end: 0.35em;
}
</style>

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4" autoplay=true %}


*Drag the divider to see whether collision follows the visible blades.*

## Which method should I use?

- **[Blueprint Tick](#blueprint-tick)** when gameplay needs direct control over the blade angle.
- **[Rotating Movement Component](#rotating-movement-component)** for continuous spin when gameplay mainly changes the speed.
- **[World Position Offset (WPO)](#material-world-position-offset)** for decorative fans where accurate blade collision matters little. Around 10–20 visual-only fans is where I'd start profiling WPO against transform rotation. The benchmark below uses 400.

## What 400 fans cost

In this editor test, WPO’s game-thread time was close to static. Rotating Movement Component used less game-thread time than Blueprint Tick.

| 400 fans | Game thread (ms/frame) | GPU scene render (ms/frame) |
| --- | ---: | ---: |
| Static | 8.36 | 6.32 |
| Material WPO | 8.34 | 6.35 |
| Rotating Movement Component | 11.65 | 6.61 |
| Blueprint Tick | 13.80 <span class="rotation-tick-delta">(+2.00 ms in rotation ticks)</span> | 6.92 |
{: .rotation-table}

The game-thread totals for Blueprint Tick and Rotating Movement Component differ by **2.15 ms/frame**. The red **+2.00 ms** compares only the measured rotation ticks.

**WPO on vs. off in the same map.** Enabling WPO increased Virtual Shadow Map rendering by about **0.11 ms/frame**. The whole-scene GPU difference varied more across runs.

<details class="fan-trace" markdown="1">
<summary>How I tested</summary>

I used **Unreal Engine 5.7.3** on an **RTX 3080** in realtime editor simulation. Each level had a 20×20 grid of the same Nanite mesh, a floor, an overhead directional light, and a fixed camera. Static and WPO used different materials, and the component level used movable meshes. For the WPO toggle, I used the same map and material and checked both states in Nanite’s **Evaluate WPO** view. I turned the visualization off for timing.

The static and WPO comparison uses three trimmed windows per method. The trace screenshots below show individual runs. I read inclusive medians from `I.Med` in Unreal Insights, using `FEngineLoop::Tick` on `GameThread` and `SceneRender` on `GPU0-Graphics0` for the whole-scene timings.

</details>

## Blueprint Tick {#blueprint-tick}

**When I’d use it.** When the blade angle matters to gameplay.

**Setup.** Connect **Event Tick** to **Add Actor Local Rotation**. The graph below turns one degree per tick. For a steady speed, multiply degrees per second by **Delta Seconds** instead. If the housing stays still, rotate a separate blade component with its pivot at the hub.

![Blueprint Tick connected to Add Actor Local Rotation]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

*The example applies one degree each time Event Tick runs.*

**Collision.** It follows the transform when enabled. For a fast trap, check whether the blade skips contacts between frames.

**Cost.** With 400 fans, the Blueprint actor ticks took a median **5.24 ms per game frame**, including the transform updates.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>View Unreal Insights trace</summary>

![Insights Game Frame mode showing a 5.24 ms inclusive median for the Blueprint actor tick]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Blueprint-Game-Frame.png' | relative_url }})

</details>

## Rotating Movement Component {#rotating-movement-component}

**When I’d use it.** When the fan keeps spinning and gameplay changes the speed.

**Setup.** Add a **Rotating Movement Component**, enable **Rotation in Local Space**, and set **Rotation Rate** around the shaft axis. Use **Set Updated Component** if the blades have their own component. A Timeline can wind the fan down when the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

*Rotation Rate is set on the local shaft axis.*

**Collision.** It follows the updated component. The rotation step doesn’t sweep for hits.

**Cost.** The component runs in C++, and it still has to update the transform each frame. The 400 movement ticks took a median **3.24 ms per game frame**. In the same editor session, the whole game thread took **11.65 ms/frame** with the component and **13.80 ms/frame** with Blueprint Tick.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>View Unreal Insights trace</summary>

![Insights Game Frame mode showing a 3.24 ms inclusive median for RotatingMovement]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Component-Matched-Game-Frame.png' | relative_url }})

</details>

## Material World Position Offset {#material-world-position-offset}

**When I’d use it.** For decorative fans that can spin visually.

**Setup.** Feed the normalized world-space shaft axis and the hub pivot into **RotateAboutAxis**. Drive the angle with **Time × Speed** and plug the result into **World Position Offset (WPO)**. If the highlights look wrong as the blades turn, check the shading normals.

![Material graph using RotateAboutAxis to drive World Position Offset]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

*RotateAboutAxis calculates the displacement that feeds World Position Offset.*

**Collision.** It stays at the original pose while the rendered blades spin.

**Cost.** There’s no per-fan rotation tick. The game-thread timings stayed close to static in my test.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>View Unreal Insights trace</summary>

**Static — `FanBench_Static_R1`**

![Unreal Insights showing 8.30 ms game thread and 6.32 ms GPU scene render for Static]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-static-R1.png' | relative_url }})

**Material WPO — `FanBench_WPO_R1`**

![Unreal Insights showing 8.42 ms game thread and 6.40 ms GPU scene render for WPO]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-wpo-R1.png' | relative_url }})

*Read `I.Med` for median milliseconds. Each screenshot shows its full R1 window. The main benchmark table uses three trimmed windows per method.*

The static-to-WPO differences were within the variation across the three measurement windows. These whole-scene timings come from levels that used different materials.

</details>

For another use of WPO, see [how I bake deformation into vertex colors in Houdini and reconstruct it in Unreal]({% post_url 2026-10-03-linear-deformation-vertex-colors-wpo %}).

/Andrei
