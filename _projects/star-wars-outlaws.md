---
layout: project
title: "Star Wars Outlaws"
role: "Senior Technical Artist"
company: "Massive Entertainment"
summary: "Built destruction workflows, Houdini tools, and gameplay-integrated visual systems for production."
image: "/assets/images/projectcovers/SWO.jpg"
release_year: 2024
permalink: /projects/star-wars-outlaws/
links:
  - label: "ArtStation"
    url: "https://www.artstation.com/nistorandrei/albums/10848560"
trailer_video: "/assets/videos/SWO.mp4"
---

## Overview
My time on this project was very broad as I was lucky enough to be in the team right from the start. A couple of mentionable accomplishments:

• Houdini VAT destroyable environment  
• Houdini Fracturing for VFX setup  
• Performance optimization (offsetting costs to GPU)  
• Cloth interaction and simulation  
• Main Ship and speeder procedural animation setup  
• Turret look at procedural animation (deployment, vfx trigger, look ats and destroyed state logic)  
• Grappling hook early implementation (this was later on polished by my colleague Kirill Arafev)  
• Wanted Screens procedural logic and setup  
• Trailblazer (main ship) ownership  
• Speeders destruction  
• Speeder destruction of environment assets (setup, development and entire workflow)

## Deep dives

{% assign sw_pages = site.pages | where: "parent_slug", "star-wars-outlaws" | sort: "title" %}

<div class="card-grid">
  {% for subpage in sw_pages %}
    <article class="card">
      <a href="{{ subpage.url | relative_url }}">
        {% assign first_media_src = nil %}
        {% assign page_content = subpage.content | default: '' %}
        {% if page_content contains 'src="' %}
          {% assign first_media_src = page_content | split: 'src="' | slice: 1, 1 | first | split: '"' | first %}
        {% endif %}

        {% if subpage.image %}
          <img src="{{ subpage.image | relative_url }}" alt="" class="card-thumb">
        {% elsif subpage.youtube_id %}
          <img src="https://img.youtube.com/vi/{{ subpage.youtube_id }}/hqdefault.jpg" alt="" class="card-thumb">
        {% elsif first_media_src %}
          <img src="{{ first_media_src | relative_url }}" alt="" class="card-thumb">
        {% else %}
          <img src="{{ '/assets/images/placeholder.png' | relative_url }}" alt="" class="card-thumb">
        {% endif %}
      </a>
      <h3><a href="{{ subpage.url | relative_url }}">{{ subpage.title }}</a></h3>
      {% if subpage.summary %}
        <p>{{ subpage.summary }}</p>
      {% endif %}
    </article>
  {% endfor %}
</div>
