---
layout: default
title: Blog
permalink: /blog/
---
<section class="page-header">
  <p class="eyebrow">Blog</p>
  <h1>Posts</h1>
  <p class="lead">Browse all posts below or filter by tag.</p>
</section>

<section class="section-block">
  <div class="section-head">
    <h2>Tags</h2>
  </div>
  <div class="tag-cloud">
    {% assign sorted_tags = site.tags | sort %}
    {% for tag in sorted_tags %}
      {% assign tag_name = tag[0] %}
      {% assign visible_posts = tag[1] | where_exp: "post", "post.hidden != true" %}
      {% if visible_posts.size > 0 %}
      <a class="tag-chip" href="{{ '/tags/' | append: tag_name | downcase | append: '/' | relative_url }}">
        {{ tag_name | upcase }} <span>{{ visible_posts.size }}</span>
      </a>
      {% endif %}
    {% endfor %}
  </div>
</section>

<section class="card-grid">
  {% for post in site.posts %}
    {% if post.hidden != true %}
    <article class="card js-clickable-card" data-href="{{ post.url | relative_url }}" role="link" tabindex="0" aria-label="Open {{ post.title }}">
      <div class="card-media">
        {% assign placeholder_label = post.placeholder_text | default: post.title | default: "Unannounced Project" %}
        {% if post.show_text_placeholder == true %}
          <div class="card-thumb project-text-placeholder" aria-label="{{ placeholder_label }}">
            <span>{{ placeholder_label }}</span>
          </div>
        {% elsif post.thumbnail_video %}
          {% include post-video-thumbnail.html post=post %}
        {% elsif post.image == blank and post.youtube_id == blank %}
          <div class="card-thumb project-text-placeholder" aria-label="{{ placeholder_label }}">
            <span>{{ placeholder_label }}</span>
          </div>
        {% elsif post.image %}
          <img src="{{ post.image | relative_url }}" alt="{{ post.title }} thumbnail" class="card-thumb">
        {% elsif post.youtube_id %}
          <img src="https://img.youtube.com/vi/{{ post.youtube_id }}/hqdefault.jpg" alt="{{ post.title }} video thumbnail" class="card-thumb">
        {% else %}
          <img src="{{ '/assets/images/placeholder.png' | relative_url }}" alt="{{ post.title }} placeholder thumbnail" class="card-thumb">
        {% endif %}
        <div class="card-overlay">
          <p>{{ post.overlay_text | default: post.excerpt | strip_html | truncate: 140 }}</p>
        </div>
      </div>
      <p class="meta">{{ post.date | date: "%B %-d, %Y" }}</p>
      <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      {% if post.tags %}
        <div class="post-tags">
          {% for tag in post.tags %}
            <a class="tag-chip small" href="{{ '/tags/' | append: tag | downcase | append: '/' | relative_url }}">{{ tag | upcase }}</a>
          {% endfor %}
        </div>
      {% endif %}
      <p>{{ post.excerpt | strip_html | truncate: 220 }}</p>
    </article>
    {% endif %}
  {% endfor %}
</section>
