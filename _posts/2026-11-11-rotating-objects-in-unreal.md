---
layout: post
title: "Three Ways to Spin a Fan in Unreal Engine"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/thumbnail_blogPost.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/visual_rotation.mp4"
excerpt: "Blueprint Tick, Rotating Movement Component, and World Position Offset compared"
---

Going over ways to spin objects in Unreal, their pros and cons and some profiling data between Blueprint tick transform, rotating component on actor and WPO rotation.

<style>
.fan-trace > summary {
  cursor: pointer;
}
.fan-trace > summary .fan-trace-icon {
  display: inline-block;
  margin-inline-end: 0.35em;
}
</style>

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/visual_rotation.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/collision_rotation.mp4" autoplay=true %}


*Drag the divider to see whether collision follows the visible blades.*

## Which method should I use?

- **[Blueprint Tick](#blueprint-tick)** when gameplay needs direct control over the blade.
- **[Rotating Movement Component](#rotating-movement-component)** for continuous spin when gameplay mainly changes the speed and axis.
- **[World Position Offset (WPO)](#material-world-position-offset)** for decorative fans where accurate blade collision matters little. Around 10–20 visual-only fans is where I'd start profiling WPO against transform rotation. The benchmark below uses 400.

## What 400 fans cost

For 1 fan either of these solutions work and probably you won't feel a dent in your performance, however when we add more the difference in costs is easier to be seen. So thats why i took 400 fans and profiled them.
WPO and static measured **8.33** and **8.31 ms/frame** on the game thread, respectively.

| 400 fans | Game thread (ms/frame) | GPU scene render (ms/frame) |
| --- | ---: | ---: |
| Static(our baseline) | 8.31 | 7.61 |
| Material WPO | 8.33 | 7.69 |
| Rotating Movement Component | 13.43 <span class="rotation-tick-delta">(+5.13 ms vs static)</span> | 10.89 |
| Blueprint Tick | 13.84 <span class="rotation-tick-delta">(+5.53 ms vs static)</span> | 10.47 |
{: .rotation-table}

The Blueprint Tick and Rotating Movement Component totals differed by **0.41 ms/frame** on the game thread. Their measured rotation scopes differed by **1.89 ms/frame**. The component's game-thread window medians ranged from **11.89 to 24.57 ms/frame**, so the difference in total game-thread time is sensitive to the capture window.

**WPO on vs. off in the same map.** Enabling WPO raised the GPU `ShadowDepths` timer by about **0.15 ms/frame** across four paired windows. The paired median change in total GPU frame time was **+0.01 ms/frame**.

<details class="fan-trace" markdown="1">
<summary>How I tested</summary>

I used **Unreal Engine 5.8.4** on an **RTX 3080** in realtime editor simulation. Each level had a 20×20 grid of the same Nanite mesh, a floor, an overhead directional light, and a fixed camera. The table reports the median of three 3-second window medians per method, with 100 ms trimmed at each end. I ran the captures in a separate editor process while the working editor stayed open. Static and WPO used different materials. The transform-driven levels used movable meshes. The WPO material used world-space normals and a 900 cm displacement override.


</details>

## Blueprint Tick {#blueprint-tick}

**When I’d use it.** When the blade angle matters to gameplay.

**Setup.** Connect **Event Tick** to **Add Actor Local Rotation**. The graph below turns one degree per tick. For a steady speed, multiply degrees per second by **Delta Seconds** instead. If the housing stays still, rotate a separate blade component with its pivot at the hub.

![Blueprint Tick connected to Add Actor Local Rotation]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

*The example applies one degree each time Event Tick runs.*

**Collision.** It follows the transform when enabled. For a fast trap, check whether the blade skips contacts between frames.

**Cost.** With 400 fans, the Blueprint actor ticks took a median **5.60 ms per game frame**, including the transform updates.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>View Unreal Insights trace</summary>

![UE 5.8.4 Unreal Insights, Blueprint Tick R2 at 5.577 ms per game frame]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-UE584-BP.png' | relative_url }})

*Full R2 window. The Blueprint actor tick had a median inclusive cost of 5.577 ms per game frame.*

</details>

## Rotating Movement Component {#rotating-movement-component}

**When I’d use it.** When the fan keeps spinning and gameplay changes the speed.

**Setup.** Add a **Rotating Movement Component**, enable **Rotation in Local Space**, and set **Rotation Rate** around the shaft axis. Use **Set Updated Component** if the blades have their own component. A Timeline can wind the fan down when the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

*Rotation Rate is set on the local shaft axis.*

**Collision.** It follows the updated component. The rotation step doesn’t sweep for hits.

**Cost.** The component runs in C++, and it still has to update the transform each frame. The 400 movement ticks took a median **3.71 ms per game frame**. The whole game thread measured **13.43 ms/frame** with the component and **13.84 ms/frame** with Blueprint Tick.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>View Unreal Insights trace</summary>

![UE 5.8.4 Unreal Insights, Rotating Movement R2 at 3.700 ms per game frame]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-UE584-Component.png' | relative_url }})

*Full R2 window. Rotating Movement had a median inclusive cost of 3.700 ms per game frame.*

</details>

## Material World Position Offset {#material-world-position-offset}

**When I’d use it.** For decorative fans that can spin visually.

**Setup.** Feed the normalized world-space shaft axis and the hub pivot into **RotateAboutAxis**. Drive the angle with **Time × Speed** and plug the result into **World Position Offset (WPO)**. If the highlights look wrong as the blades turn, check the shading normals.

![Material graph using RotateAboutAxis to drive World Position Offset]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

*RotateAboutAxis calculates the displacement that feeds World Position Offset.*

**Collision.** It stays at the original pose while the rendered blades spin.

**Cost.** There’s no per-fan rotation tick. In this test, the WPO scene measured **7.69 ms/frame** of GPU scene rendering, compared with **7.61 ms/frame** for the static scene.

<details class="fan-trace" markdown="1">
<summary><span class="fan-trace-icon" aria-hidden="true">&#x1F50D;</span>View Unreal Insights trace</summary>

**Static — `FanBench_Static_R1`**

![UE 5.8.4 Unreal Insights, Static R1 at 8.271 ms on the game thread and 7.301 ms for GPU scene rendering]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-UE584-Static.png' | relative_url }})

**Material WPO — `FanBench_WPO_R1`**

![UE 5.8.4 Unreal Insights, WPO R1 at 8.416 ms on the game thread and 7.270 ms for GPU scene rendering]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-UE584-WPO.png' | relative_url }})

*Read `I.Med` for median milliseconds. Static R1 measured 8.271 ms on the game thread and 7.301 ms for GPU scene rendering. WPO R1 measured 8.416 ms and 7.270 ms, respectively. These screenshots show the full R1 windows. The table summarizes three trimmed windows.*

</details>

For another use of WPO, see [how I bake deformation into vertex colors in Houdini and reconstruct it in Unreal]({% post_url 2026-10-03-linear-deformation-vertex-colors-wpo %}).

/Andrei
