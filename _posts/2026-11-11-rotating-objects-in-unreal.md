---
layout: post
title: "Different methods to rotate objects in Unreal and their pros and cons"
date: 2026-11-11
tags: [unreal, workflow]
image: "/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png"
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

#### Blueprint - Using C++ Rotator component 
This is the current recomended way of rotating an object inside UE

![Rotating Movement Component with local-space rotation enabled]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_component.png' | relative_url }})

<video controls playsinline preload="metadata" aria-label="Fan collision demo in Unreal Engine" style="display: block; width: 100%; height: auto;">
  <source src="{{ '/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4' | relative_url }}" type="video/mp4">
  <a href="{{ '/assets/videos/blog/rotating-objects-in-unreal/rotation_col.mp4' | relative_url }}">Watch the fan collision demo</a>.
</video>

### Material - WPO Rotate
WPO was used for a lot of cheap tricks in the past, and its something i personally miss a lot in my day to day work, however with the new pipelines using Nanite WPO is becoming something more expensive than before.

![Unreal material function that normalizes the world-space axis and uses RotateAboutAxis to produce a World Position Offset]({{ '/assets/images/blog/rotating-objects-in-unreal/rotation_wpo.png' | relative_url }})


## TL;DR
I want to add conclusions and pro / cons / maybe an unreal insight trace with all of them


/Andrei
