---
layout: default
title: Home
---

<section class="hero landing-hero">
  <div class="hero-backdrop" aria-hidden="true"></div>
  <div class="hero-content hero-content-elevated">
    <p class="eyebrow hero-eyebrow">Technical Artist · Game Developer · Procedural Artist</p>
    <h1 class="hero-title">Senior Technical Artist with 14+ years of <span class="hero-title-accent">AAA</span> game development.</h1>
    <p class="lead hero-lead">Hi, I'm <strong>Ioan-Andrei Nistor</strong>. I love improving workflows, problem solving, procedural content and real-time visuals. I developed tools, destruction systems, and gameplay systems/solutions while mentoring teams and establishing best practices.</p>
    <div class="hero-cta-row">
      <a class="button" href="{{ '/projects/' | relative_url }}">View projects</a>
      <a class="button secondary" href="{{ '/cv/' | relative_url }}">About me</a>
    </div>
  </div>

  <div class="hero-image-container hero-content-elevated">
    <video id="hero-feature-video" class="hero-feature-video" autoplay muted loop playsinline preload="auto" aria-label="Showreel preview">
      <source src="{{ '/assets/videos/SWO.mp4' | relative_url }}" type="video/mp4">
    </video>
  </div>
</section>

<section class="section-block preferred-stack-block">
  <p class="stack-label">Preferred Stack</p>
  <ul class="hero-stack-list" aria-label="Preferred technical stack">
    <li><img src="https://cdn.simpleicons.org/houdini/FF6A00" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>Houdini</span></li>
    <li><img src="https://cdn.simpleicons.org/unrealengine/FFFFFF" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>Unreal Engine</span></li>
    <li><img src="https://cdn.simpleicons.org/python/3776AB" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>Python</span></li>
    <li><img src="https://cdn.simpleicons.org/autodeskmaya/2AB4E8" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>Maya</span></li>
    <li><img src="https://cdn.simpleicons.org/blender/F5792A" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>Blender</span></li>
    <li><img src="https://images.seeklogo.com/logo-png/48/2/3ds-max-logo-png_seeklogo-482396.png" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>3ds Max</span></li>
    <li><img src="{{ '/assets/images/companieslogos/snowdrop.png' | relative_url }}" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>Snowdrop</span></li>
    <li><img src="{{ '/assets/images/companieslogos/lumberyard.png' | relative_url }}" alt="" class="hero-stack-icon" loading="lazy" decoding="async"><span>Lumberyard</span></li>
  </ul>
</section>

<section class="section-block">
  <div class="section-head">
    <h2>Projects</h2>
    <a href="{{ '/projects/' | relative_url }}">See all</a>
  </div>

  <div class="projects-row-wrap projects-row-wrap--with-arrows">
    <button class="projects-row-nav projects-row-nav-prev" type="button" aria-label="Scroll projects left" data-row-nav="prev">←</button>

    <div class="projects-row" data-projects-row data-scroll-row>
      {% assign sorted_projects = site.projects | sort: "release_year" | reverse %}
      {% for project in sorted_projects %}
        {% if project.hidden != true %}
        <article class="project-row-card js-clickable-card" data-href="{{ project.url | relative_url }}" role="link" tabindex="0" aria-label="Open {{ project.title }}">
          <div class="project-row-media">
            {% assign placeholder_label = project.placeholder_text | default: project.title | default: "Unannounced Project" %}
            {% if project.show_text_placeholder == true or project.image == blank %}
              <div class="project-row-image project-text-placeholder" aria-label="{{ placeholder_label }}">
                <span>{{ placeholder_label }}</span>
              </div>
            {% else %}
              <img src="{{ project.image | relative_url }}" alt="{{ project.title }} thumbnail" class="project-row-image" loading="lazy" decoding="async" fetchpriority="low">
            {% endif %}
            <p class="project-card-summary">{{ project.summary }}</p>
          </div>
          <div class="project-row-copy">
            <h3 class="project-card-title"><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h3>

            {% if project.company or project.role %}
              <p class="meta project-card-meta">
                {% if project.company %}{{ project.company }}{% endif %}
                {% if project.company and project.role %} · {% endif %}
                {% if project.role %}{{ project.role }}{% endif %}
              </p>
            {% endif %}

          </div>
        </article>
        {% endif %}
      {% endfor %}
    </div>
    <button class="projects-row-nav projects-row-nav-next" type="button" aria-label="Scroll projects right" data-row-nav="next">→</button>
  </div>
</section>

<!-- Restored original Blog/Tools layout to match earlier baseline -->
<section class="section-block">
  <div class="section-head">
    <div>
      <h2>Blog</h2>
    </div>
    <a href="{{ '/blog/' | relative_url }}">See all</a>
  </div>
  <div class="projects-row-wrap projects-row-wrap--with-arrows">
    {% if site.posts.size > 4 %}<button class="projects-row-nav projects-row-nav-prev" type="button" aria-label="Scroll blog left" data-row-nav="prev">←</button>{% endif %}
    <div class="projects-row-hint">Scroll for older posts</div>
    <div class="projects-row blog-row" data-scroll-row>
      {% for post in site.posts %}
        {% if post.hidden != true %}
        <article class="card blog-row-card js-clickable-card" data-href="{{ post.url | relative_url }}" role="link" tabindex="0" aria-label="Open {{ post.title }}">
          {% assign placeholder_label = post.placeholder_text | default: post.title | default: "Unannounced Project" %}
          {% if post.show_text_placeholder == true %}
            <div class="card-thumb project-text-placeholder" aria-label="{{ placeholder_label }}">
              <span>{{ placeholder_label }}</span>
            </div>
          {% elsif post.image == blank and post.youtube_id == blank %}
            <div class="card-thumb project-text-placeholder" aria-label="{{ placeholder_label }}">
              <span>{{ placeholder_label }}</span>
            </div>
          {% elsif post.image %}
            <img src="{{ post.image | relative_url }}" alt="{{ post.title }} thumbnail" class="card-thumb" loading="lazy" decoding="async" fetchpriority="low">
          {% elsif post.youtube_id %}
            <img src="https://img.youtube.com/vi/{{ post.youtube_id }}/hqdefault.jpg" alt="{{ post.title }} video thumbnail" class="card-thumb" loading="lazy" decoding="async" fetchpriority="low">
          {% else %}
            <img src="{{ '/assets/images/placeholder.png' | relative_url }}" alt="{{ post.title }} placeholder thumbnail" class="card-thumb" loading="lazy" decoding="async" fetchpriority="low">
          {% endif %}
          <p class="meta">{{ post.date | date: "%B %-d, %Y" }}</p>
          <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
          {% if post.tags %}
            <div class="post-tags">
              {% for tag in post.tags %}
                <a class="tag-chip small" href="{{ '/tags/' | append: tag | downcase | append: '/' | relative_url }}">{{ tag | upcase }}</a>
              {% endfor %}
            </div>
          {% endif %}
          <p>{{ post.excerpt | strip_html | truncate: 140 }}</p>
        </article>
        {% endif %}
      {% endfor %}
    </div>
    {% if site.posts.size > 4 %}<button class="projects-row-nav projects-row-nav-next" type="button" aria-label="Scroll blog right" data-row-nav="next">→</button>{% endif %}
  </div>
  {% if site.posts.size > 3 %}
    <a class="blog-scroll-hint" href="{{ '/blog/' | relative_url }}" aria-label="Go to older blog posts">
      <span>Scroll right for older posts</span>
      <span aria-hidden="true">→</span>
    </a>
  {% endif %}
</section>

<section class="section-block">
  <div class="section-head">
    <h2>Tools</h2>
    <a href="{{ '/tools/' | relative_url }}">See all</a>
  </div>
  {% assign featured_tools = site.tools | where: 'featured', true | sort: 'landing_position' %}
  <div class="projects-row-wrap projects-row-wrap--with-arrows">
    {% if featured_tools.size > 4 %}<button class="projects-row-nav projects-row-nav-prev" type="button" aria-label="Scroll tools left" data-row-nav="prev">←</button>{% endif %}
    <div class="projects-row-hint">Scroll for more tools</div>
    <div class="projects-row blog-row" data-scroll-row>
      {% for tool in featured_tools limit: 6 %}
        <article class="card blog-row-card js-clickable-card" data-href="{{ tool.url | relative_url }}" role="link" tabindex="0" aria-label="Open {{ tool.title }}">
          {% assign placeholder_label = tool.placeholder_text | default: tool.title | default: "Unannounced Project" %}
          {% if tool.show_text_placeholder == true or tool.image == blank %}
            <div class="card-thumb project-text-placeholder" aria-label="{{ placeholder_label }}">
              <span>{{ placeholder_label }}</span>
            </div>
          {% elsif tool.image %}
            <img src="{{ tool.image | relative_url }}" alt="" class="card-thumb" loading="lazy" decoding="async" fetchpriority="low">
          {% else %}
            <img src="{{ '/assets/images/placeholder.png' | relative_url }}" alt="" class="card-thumb" loading="lazy" decoding="async" fetchpriority="low">
          {% endif %}
          <h3><a href="{{ tool.url | relative_url }}">{{ tool.title }}</a></h3>
          <p>{{ tool.summary }}</p>
        </article>
      {% endfor %}
    </div>
    {% if featured_tools.size > 4 %}<button class="projects-row-nav projects-row-nav-next" type="button" aria-label="Scroll tools right" data-row-nav="next">→</button>{% endif %}
  </div>
</section>

<section class="section-block" id="contact">
  <div class="section-head">
    <h2>Contact</h2>
  </div>
  <div class="card contact-box contact-strip">
    <div class="contact-copy">
      <h3>Let's connect</h3>
      <p>Always open to discussing new projects, tools, and technical art solutions.</p>
    </div>

    <ul class="contact-list contact-list-inline" aria-label="Social links">
      <li>
        <a href="mailto:{{ site.email }}" class="contact-icon-link" aria-label="Email">
          <span class="contact-icon" aria-hidden="true">✉</span>
        </a>
      </li>
      <li>
        <a href="https://www.linkedin.com/in/ianistor" target="_blank" rel="noopener noreferrer" class="contact-icon-link" aria-label="LinkedIn">
          <span class="contact-icon" aria-hidden="true">in</span>
        </a>
      </li>
      <li>
        <a href="https://www.artstation.com/nistorandrei" target="_blank" rel="noopener noreferrer" class="contact-icon-link" aria-label="ArtStation">
          <span class="contact-icon contact-icon-artstation" aria-hidden="true">
            <img src="https://raw.githubusercontent.com/ianistor/ian_website/main/assets/images/companieslogos/artstation_grey.png" alt="" class="contact-icon-img" loading="lazy" decoding="async">
          </span>
        </a>
      </li>
      <li>
        <a href="https://github.com/ianistor" target="_blank" rel="noopener noreferrer" class="contact-icon-link" aria-label="GitHub">
          <span class="contact-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" role="img" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.45-1.15-1.1-1.45-1.1-1.45-.9-.62.07-.6.07-.6 1 .08 1.53 1.03 1.53 1.03.88 1.52 2.31 1.08 2.87.83.09-.64.35-1.08.63-1.32-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-2 1.03-2.7-.1-.25-.45-1.27.1-2.65 0 0 .85-.27 2.8 1.03a9.7 9.7 0 0 1 5.1 0c1.94-1.3 2.8-1.03 2.8-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.7 0 3.85-2.35 4.7-4.58 4.95.36.3.68.9.68 1.8v2.67c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
            </svg>
          </span>
        </a>
      </li>
    </ul>
  </div>
</section>
