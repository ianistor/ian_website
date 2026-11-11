document.querySelectorAll('[data-video-compare]').forEach((comparison) => {
  const visual = comparison.querySelector('[data-video-compare-primary]');
  const collision = comparison.querySelector('[data-video-compare-secondary]');
  const toggle = comparison.querySelector('[data-video-compare-toggle]');
  const errorMessage = comparison.querySelector('[data-video-compare-error]');

  const syncCollision = () => {
    if (collision.readyState < HTMLMediaElement.HAVE_METADATA) return;
    if (Math.abs(collision.currentTime - visual.currentTime) > 0.12) {
      collision.currentTime = visual.currentTime;
    }
  };

  const showPlaybackError = () => {
    visual.pause();
    collision.pause();
    errorMessage.hidden = false;
  };

  visual.addEventListener('play', () => {
    toggle.textContent = 'Pause comparison';
  });
  visual.addEventListener('pause', () => {
    collision.pause();
    toggle.textContent = 'Play comparison';
  });

  visual.addEventListener('timeupdate', syncCollision);
  visual.addEventListener('seeked', syncCollision);
  collision.addEventListener('loadedmetadata', syncCollision);

  [visual, collision].forEach((video) => {
    video.addEventListener('error', showPlaybackError, true);
  });

  toggle.addEventListener('click', () => {
    if (!visual.paused) {
      visual.pause();
      return;
    }

    errorMessage.hidden = true;
    syncCollision();
    Promise.all([visual.play(), collision.play()]).catch((error) => {
      if (error.name !== 'AbortError') showPlaybackError();
    });
  });
});
