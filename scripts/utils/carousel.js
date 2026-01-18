/**
 * Carousel utility - adds arrow navigation using CSS transforms
 */

/**
 * Initialize carousel functionality on a media row
 * @param {HTMLElement} row - The .media-row element to enhance
 */
export function initCarousel(row) {
  if (!row || row.dataset.carouselInit) return;
  row.dataset.carouselInit = "true";

  // Create carousel structure
  const wrapper = document.createElement("div");
  wrapper.className = "carousel";

  const track = document.createElement("div");
  track.className = "carousel__track";

  // Create navigation buttons
  const prevBtn = document.createElement("button");
  prevBtn.className = "carousel__btn carousel__btn--prev";
  prevBtn.setAttribute("aria-label", "Scroll left");
  prevBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;

  const nextBtn = document.createElement("button");
  nextBtn.className = "carousel__btn carousel__btn--next";
  nextBtn.setAttribute("aria-label", "Scroll right");
  nextBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;

  // Build structure: wrapper > [prevBtn, track > row, nextBtn]
  row.parentNode.insertBefore(wrapper, row);
  track.appendChild(row);
  wrapper.appendChild(prevBtn);
  wrapper.appendChild(track);
  wrapper.appendChild(nextBtn);

  // Track current position
  let currentX = 0;

  // Calculate scroll amount (3 cards width + gaps)
  const getScrollAmount = () => {
    const card = row.querySelector(".media-card");
    if (!card) return 600;
    const style = getComputedStyle(row);
    const gap = parseInt(style.gap) || 16;
    return (card.offsetWidth + gap) * 3;
  };

  // Get maximum scroll distance
  const getMaxScroll = () => {
    const rowWidth = row.scrollWidth;
    const trackWidth = track.offsetWidth;
    return Math.max(0, rowWidth - trackWidth);
  };

  // Update transform and button visibility
  const updateCarousel = () => {
    const maxScroll = getMaxScroll();

    // Clamp position
    currentX = Math.max(0, Math.min(currentX, maxScroll));

    // Apply transform
    row.style.transform = `translateX(${-currentX}px)`;

    // Update button visibility
    const atStart = currentX <= 0;
    const atEnd = currentX >= maxScroll - 5;

    prevBtn.classList.toggle("carousel__btn--hidden", atStart);
    nextBtn.classList.toggle("carousel__btn--hidden", atEnd);
  };

  // Add smooth transition
  row.style.transition = "transform 300ms ease";

  // Scroll handlers
  prevBtn.addEventListener("click", () => {
    currentX -= getScrollAmount();
    updateCarousel();
  });

  nextBtn.addEventListener("click", () => {
    currentX += getScrollAmount();
    updateCarousel();
  });

  // Initial state
  updateCarousel();

  // Update on resize
  const resizeObserver = new ResizeObserver(() => {
    updateCarousel();
  });
  resizeObserver.observe(track);
  resizeObserver.observe(row);
}

/**
 * Initialize all carousels on the page
 */
export function initAllCarousels() {
  document.querySelectorAll(".media-row").forEach(initCarousel);
}
