---
layout: post
title: "Three Ways to Spin a Fan in UE"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
thumbnail_video: "/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4"
excerpt: "Three ways to spin, and what each means for collision and performance."
---

Rotating a fan in Unreal sounds easy enough. You make it spin and move on, right? Well… then you ask whether the blades should hit anything, whether the player can change the speed, and what happens if you put 400 of them in a level.

I used a free Megascans fan to try three ways of doing it. For a decorative fan, I'd go with **World Position Offset (WPO)**. It stayed close to the static baseline in my test. If the collision has to spin too, I'd use **Rotating Movement** or **Blueprint Tick**, depending on how much control I need. I also traced Blueprint Tick against the native component. With 400 fans, it added **about 2.16 ms per frame on the game thread** compared with the component in the same editor session.

{% include video-compare.html visual="/assets/videos/blog/rotating-objects-in-unreal/rotation_visual.mp4" collision="/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4" autoplay=true %}

*Compare how the blades look with how their collision behaves.*

## Which one would I use?

| Method | When I'd use it | Collision |
| --- | --- | --- |
| [Blueprint Tick](#blueprint-tick) | A puzzle or trap that needs custom control over blade angle | Follows the transform when enabled. Test fast spins for missed contacts. |
| [Rotating Movement Component](#rotating-movement-component) | Continuous rotation with a rate that gameplay can change | Follows the updated component. The rotation step doesn't sweep for hits. |
| [Material WPO](#material-world-position-offset) | Decorative spin | Stays at the mesh's original pose |
{: .rotation-table .fan-method-guide}

## Okay, what happens with 400 of them?

| 400 fans | Game thread (ms/frame) | GPU scene render (ms/frame) |
| --- | ---: | ---: |
| Static | 8.33–8.45 | 6.27–6.54 |
| Material WPO | 8.32–8.37 | 6.27–6.37 |
| Rotating Movement | 11.64–12.09 | 6.65–6.73 |
| Blueprint Tick | 13.52–13.86 | 6.82–7.01 |
{: .rotation-table}

*Each range shows the lowest and highest median across three capture windows. For the same-session Blueprint and component numbers, see [Blueprint Tick](#blueprint-tick).*

I started with the fans doing absolutely nothing. Static and WPO landed in the same ballpark on the game thread. The native component was the one that stood out. It added **3.34 ms per frame** versus static in this test.

Blueprint Tick took **13.80 ms/frame on the game thread**. Rotating Movement came in at **11.65 ms/frame** in the same session.

Static and WPO were effectively tied. The middle GPU scene-render times were **6.32 ms with the static material** and **6.35 ms with WPO**. Those levels used different materials, and the component level also used movable meshes. To isolate the effect of enabling WPO, I toggled it on the same map and material below.

## Blueprint Tick {#blueprint-tick}

Connect **Event Tick** to **Add Actor Local Rotation**. The graph below applies one degree per frame. For steady speed across frame rates, multiply degrees per second by **Delta Seconds**. If the housing stays still, rotate a separate blade component with its pivot at the hub.

![Blueprint Tick calling Add Actor Local Rotation]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_tick.png' | relative_url }})

This is the one I'd reach for when the angle matters to gameplay. I wanted to see what the extra Blueprint work looked like at 400 fans, so I reran the native component and the Blueprint in the same editor session. Same mesh, camera and lighting.

| 400 fans | Game-thread frame | Rotation CPU scope | GPU scene render |
| --- | ---: | ---: | ---: |
| Rotating Movement rerun | 11.65 ms | 3.24 ms | 6.61 ms |
| Blueprint Tick | 13.80 ms | 5.24 ms | 6.92 ms |
{: .rotation-table}

![Unreal Insights in Game Frame mode showing 5.24 ms median and 5.47 ms average for the Blueprint actor timer]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Blueprint-Game-Frame.png' | relative_url }})

*Game Frame mode shows **5.24 ms/frame median** (`I.Med`) and **5.47 ms/frame average** (`I.Avg`) across the selected Blueprint interval.*

The Blueprint added **about 2.16 ms per frame on the game thread**. Both traces had 400 rotation calls per measured frame. The Blueprint actor tick includes the graph and the transform update, so the gap between those scopes doesn't tell me how much the Blueprint VM costs on its own.

I tested the graph as shown above. It turns one degree per tick, while the component uses degrees per second. The blades were moving at different speeds, which matters when comparing the GPU numbers. 

## Rotating Movement Component {#rotating-movement-component}

Enable **Rotation in Local Space** and set **Rotation Rate** around the shaft axis. Use **Set Updated Component** to target the blades if they have their own component. A Timeline can change the rate if the fan needs to wind down when the power goes out.

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

So what am I actually saving by letting Unreal do the spin? The tick runs in C++, but it still has to move the component. In Insights, I switched Timers to **Game Frame**. The `RotatingMovement` row below shows **3.66 ms median** and **3.82 ms average** per game frame.

![Unreal Insights in Game Frame mode showing 3.66 ms median and 3.82 ms average for RotatingMovement]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-Component-Game-Frame.png' | relative_url }})

## Material World Position Offset {#material-world-position-offset}

I transform the shaft axis from local space to world space and normalize it before passing it to **RotateAboutAxis**. The pivot is at the hub, and **Time × Speed** drives the angle. The function's displacement goes into **World Position Offset**. Check the shading normals if highlights look wrong as the blades turn.

![Material graph with a normalized world-space axis feeding RotateAboutAxis]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})

This was the bit I wanted to poke at. WPO gets rid of the per-fan rotation tick, but what does it cost with Nanite and shadows? I went back to the same 400 fans and flipped **Evaluate World Position Offset** on the components. Same camera, same material. I checked both states in Nanite's **Evaluate WPO** view, then turned the visualization off before taking the trace.

Shadow rendering took about **0.11 ms more per frame** with WPO on, and it went up in all four pairs. The whole-scene GPU result bounced around more.

| GPU metric | What I measured |
| --- | ---: |
| Whole-scene `SceneRender` | +0.07 ms/frame median paired difference, with pair results from −0.16 to +0.64 ms |
| `RenderVirtualShadowMaps` | About +0.11 ms/frame, higher in all four pairs |
| `Shadow.Virtual.ProcessInvalidationsGPU` | About 0.001 ms/frame in both states |
{: .rotation-table}

<details markdown="1">
<summary>View the WPO on/off trace screenshots</summary>

**WPO enabled — `WPO_On_01`**

![Unreal Insights GPU Timers for WPO enabled in the first test pair]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-WPO-On-01-Game-Frame.png' | relative_url }})

**WPO disabled — `WPO_Off_02`**

![Unreal Insights GPU Timers for WPO disabled in the first test pair]({{ '/assets/images/blog/rotating-objects-in-unreal/Insights-WPO-Off-02-Game-Frame.png' | relative_url }})

*Read the two `RenderVirtualShadowMaps` rows under `I.Avg`. WPO on shows **0.47 + 0.07 ms** per game frame. WPO off shows **0.38 + 0.08 ms**. These screenshots show one pair. The results table above uses exports from all four pairs.*

</details>

**What about the shadow cache?** I looked at the invalidation timer first. It was about a microsecond either way. The part that moved was shadow rendering, which is also where Unreal redraws pages it can no longer reuse. I didn't count invalidated pages in this test, so I can't say how much of that extra 0.11 ms came from the cache and how much came from drawing the animated geometry. [Epic's Virtual Shadow Map profiling guide](https://dev.epicgames.com/documentation/en-us/unreal-engine/virtual-shadow-maps-in-unreal-engine)

## Trace setup and how to read it

I used **Unreal Engine 5.7.3** on a **GeForce RTX 3080** in realtime editor simulation. Each map had the same 20×20 grid of Nanite Megascans fans, a ground plane, and one overhead directional light. I used a fixed camera and recorded the `Cpu`, `Gpu`, `Frame`, and `Region` channels.

| Capture | Timing Regions track | Timers to inspect |
| --- | --- | --- |
| Static baseline | `FanBench_Static_R1` through `R3` | `FEngineLoop::Tick` on `GameThread`, `SceneRender` on `GPU0-Graphics0` |
| Rotating Movement | `FanBench_Component_R1` through `R3` | Same frame timers, plus `RotatingMovement` on `GameThread` |
| Material WPO | `FanBench_WPO_R1` through `R3` | Same frame timers |
| Blueprint Tick rerun | `FanBench_BP_R1` through `R3` | `SM_wcljdev_tier_4_Blueprint_C` on `GameThread`, with `ReceiveTick` nested underneath |
| WPO on/off | `WPO_On_01` and `WPO_Off_02` for the screenshot pair | `SceneRender`, `RenderVirtualShadowMaps`, and `Shadow.Virtual.ProcessInvalidationsGPU` on `GPU0-Graphics0` |
{: .rotation-table}

In Timing Insights, select a region and press **Enter**. In the Timers panel, switch **Mode** to **Game Frame**. `I.Avg` is the inclusive average per game frame, and `I.Med` is the inclusive median. The GPU benchmark table uses exported timings from `GPU0-Graphics0`. Game Frame mode groups GPU events by CPU game-frame boundaries, so the `SceneRender` row in the screenshots uses a different aggregation.

For the three-level comparison, I took a median for each capture window. The table shows the range of those medians. The **3.34 ms** game-thread difference uses the middle result for each variant. The original component capture's trimmed-window benchmark median for `RotatingMovement` was **3.67 ms/frame**. For the Blueprint and component rerun, I also took the middle result from three capture-window medians per method, trimming 0.1 seconds from both ends of each window. The WPO toggle uses four paired 2.5-second windows, trimmed by 0.1 seconds at each end. For shadow rendering, I summed the `RenderVirtualShadowMaps` scopes per frame before taking each window's median.

/Andrei
