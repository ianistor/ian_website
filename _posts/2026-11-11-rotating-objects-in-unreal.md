---
layout: post
title: "Three Ways to Spin a Fan in UE"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "Three ways to spin, and what each means for collision and performance."
---

Rotating a fan in Unreal sounds easy enough. You make it spin and move on, right? Well… does it need to react when being hit or hitting something? Do we change the speed? And most importantly what is the peformance cost?

I tried three ways to spin the same Megascans fan. Here’s how I set each one up and what it cost.

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

## Blueprint Tick {#blueprint-tick}

This is the one I'd reach for when the blade angle matters to gameplay. Connect **Event Tick** to **Add Actor Local Rotation**. The graph below turns one degree per tick. For a steady speed, multiply degrees per second by **Delta Seconds** instead. If the housing stays still, rotate a separate blade component with its pivot at the hub.

![Blueprint Tick connected to Add Actor Local Rotation]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

**Collision.** It follows the transform when enabled. For a fast trap, check whether the blade skips contacts between frames.

**Cost.** With 400 fans, the Blueprint actor ticks took a median **5.24 ms per game frame**, including the transform updates.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>Blueprint Tick trace</summary>

![Insights Game Frame mode showing a 5.24 ms inclusive median for the Blueprint actor tick]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Blueprint-Game-Frame.png' | relative_url }})

</details>

## Rotating Movement Component {#rotating-movement-component}

I'd use this when I want the fan to keep spinning and gameplay just needs to change the speed. Add a **Rotating Movement Component**, enable **Rotation in Local Space**, and set **Rotation Rate** around the shaft axis. Use **Set Updated Component** if the blades have their own component. A Timeline can wind the fan down when the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

**Collision.** It follows the updated component. The rotation step doesn’t sweep for hits.

**Cost.** The component runs in C++, and it still has to update the transform each frame. The 400 movement ticks took a median **3.24 ms per game frame**. In the same editor session, the whole game thread took **11.65 ms/frame** with the component and **13.80 ms/frame** with Blueprint Tick.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>Rotating Movement Component trace</summary>

![Insights Game Frame mode showing a 3.24 ms inclusive median for RotatingMovement]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Component-Matched-Game-Frame.png' | relative_url }})

</details>

## Material World Position Offset {#material-world-position-offset}

For a decorative fan, this is where I'd start. Feed the normalized world-space shaft axis and the hub pivot into **RotateAboutAxis**. Drive the angle with **Time × Speed** and plug the result into **World Position Offset (WPO)**. If the highlights look wrong as the blades turn, check the shading normals.

![Material graph using RotateAboutAxis to drive World Position Offset]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

**Collision.** It stays at the original pose while the rendered blades spin.

**Cost.** There’s no per-fan rotation tick. The game-thread timings stayed close to static in my test. When I toggled WPO on the same 400 fans, Virtual Shadow Map rendering went up by about **0.11 ms/frame**. The whole-scene GPU difference varied more across runs.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>WPO vs. static trace timings</summary>

| 400 fans | Game thread (ms/frame) | GPU scene render (ms/frame) |
| --- | ---: | ---: |
| Static | 8.36 | 6.32 |
| Material WPO | 8.34 | 6.35 |
{: .rotation-table}

**Static — `FanBench_Static_R1`**

![Unreal Insights showing 8.30 ms game thread and 6.32 ms GPU scene render for Static]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-static-R1.png' | relative_url }})

**Material WPO — `FanBench_WPO_R1`**

![Unreal Insights showing 8.42 ms game thread and 6.40 ms GPU scene render for WPO]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-wpo-R1.png' | relative_url }})

*Read `I.Med` for median milliseconds. Each screenshot shows its full R1 window. The table above uses three trimmed windows per method.*

Both differences were within the variation across the three measurement windows. These are whole-scene timings from the static and WPO levels, which used different materials. In Insights, I used `FEngineLoop::Tick` on `GameThread` and `SceneRender` on `GPU0-Graphics0`.

</details>

## Performance Comparison between methods

I used **Unreal Engine 5.7.3** on an **RTX 3080** in realtime editor simulation. Each level had a 20×20 grid of the same Nanite mesh, a floor, an overhead directional light, and a fixed camera. Static and WPO used different materials, and the component level used movable meshes. For the WPO toggle, I used the same map and material and checked both states in Nanite’s **Evaluate WPO** view. I turned the visualization off for timing.

| 400 fans | Game thread (ms/frame) | GPU scene render (ms/frame) |
| --- | ---: | ---: |
| Static | 8.36 | 6.32 |
| Material WPO | 8.34 | 6.35 |
| Rotating Movement Component | 11.65 | 6.61 |
| Blueprint Tick | 13.80 <span class="rotation-tick-delta">(+2.00)</span> | 6.92 |
{: .rotation-table}

The value in parentheses is the extra time Blueprint Tick spent on rotation updates per game frame compared with Rotating Movement Component.

/Andrei
