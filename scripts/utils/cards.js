/**
 * Shared utilities for creating media cards
 */

export const createSkeletonCard = () => {
  const card = document.createElement("li");
  card.className = "media-card media-card--placeholder";

  const cover = document.createElement("div");
  cover.className = "media-card__cover";

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const line1 = document.createElement("div");
  line1.className = "skeleton-line";

  const line2 = document.createElement("div");
  line2.className = "skeleton-line skeleton-line--short";

  meta.append(line1, line2);
  card.append(cover, meta);

  return card;
};

export const renderSkeleton = (listEl, count) => {
  if (!listEl) return;
  listEl.classList.add("loading");
  const cards = Array.from({ length: count }, () => createSkeletonCard());
  listEl.replaceChildren(...cards);
};

export const createPlaceholderCard = (title, subtitle) => {
  const card = document.createElement("li");
  card.className = "media-card media-card--placeholder";

  const cover = document.createElement("div");
  cover.className = "media-card__cover";

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const titleEl = document.createElement("div");
  titleEl.className = "media-card__title";
  titleEl.textContent = title;

  const subtitleEl = document.createElement("div");
  subtitleEl.className = "media-card__subtitle";
  subtitleEl.textContent = subtitle;

  meta.append(titleEl, subtitleEl);
  card.append(cover, meta);

  return card;
};

export const renderPlaceholder = (listEl, count, title, subtitle) => {
  if (!listEl) return;
  const cards = Array.from({ length: count }, () =>
    createPlaceholderCard(title, subtitle)
  );
  listEl.replaceChildren(...cards);
  listEl.classList.remove("loading");
};

export const createMediaCard = ({
  href,
  coverUrl,
  coverAlt = "",
  title,
  subtitle,
  badge,
  coverClass = "",
  customCoverContent = null,
  additionalContent = null,
}) => {
  const card = document.createElement("li");
  card.className = "media-card";

  const link = document.createElement("a");
  link.className = "media-card__link";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const cover = document.createElement("div");
  cover.className = `media-card__cover${coverClass ? " " + coverClass : ""}`;

  if (customCoverContent) {
    cover.append(customCoverContent);
  } else if (coverUrl) {
    const img = document.createElement("img");
    img.src = coverUrl;
    img.alt = coverAlt;
    img.loading = "lazy";
    cover.append(img);
  }

  if (badge) {
    const badgeEl = document.createElement("span");
    badgeEl.className = "media-card__badge";
    badgeEl.textContent = badge;
    cover.append(badgeEl);
  }

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const titleEl = document.createElement("div");
  titleEl.className = "media-card__title";
  titleEl.textContent = title;

  const subtitleEl = document.createElement("div");
  subtitleEl.className = "media-card__subtitle";
  subtitleEl.textContent = subtitle;

  meta.append(titleEl, subtitleEl);

  if (additionalContent) {
    meta.append(additionalContent);
  }

  link.append(cover, meta);
  card.append(link);

  return card;
};

export const finishLoading = (listEl) => {
  if (!listEl) return;
  listEl.classList.remove("loading");
};
