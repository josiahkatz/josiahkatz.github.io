import { config } from "./config.js";

const createSkeletonCard = () => {
  const card = document.createElement("li");
  card.className = "media-card media-card--placeholder";

  const cover = document.createElement("div");
  cover.className = "media-card__cover media-card__cover--tall";

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

const renderSkeleton = (listEl, count) => {
  const cards = Array.from({ length: count }, () => createSkeletonCard());
  listEl.replaceChildren(...cards);
};

const renderPlaceholder = (listEl, count, title, subtitle) => {
  const cards = Array.from({ length: count }, () => {
    const card = document.createElement("li");
    card.className = "media-card media-card--placeholder";

    const cover = document.createElement("div");
    cover.className = "media-card__cover media-card__cover--tall";

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
  });

  listEl.replaceChildren(...cards);
};

const createBookCard = (book) => {
  const card = document.createElement("li");
  card.className = "media-card";

  const link = document.createElement(book.link ? "a" : "div");
  link.className = "media-card__link";

  if (book.link) {
    link.href = book.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }

  const cover = document.createElement("div");
  cover.className = "media-card__cover media-card__cover--tall";

  if (book.coverUrl) {
    const img = document.createElement("img");
    img.src = book.coverUrl;
    img.alt = book.title ? `${book.title} cover` : "Book cover";
    img.loading = "lazy";
    cover.append(img);
  }

  if (book.status) {
    const badge = document.createElement("span");
    badge.className = "media-card__badge";
    badge.textContent = book.status;
    cover.append(badge);
  }

  const meta = document.createElement("div");
  meta.className = "media-card__meta";

  const title = document.createElement("div");
  title.className = "media-card__title";
  title.textContent = book.title || "Untitled";

  const subtitle = document.createElement("div");
  subtitle.className = "media-card__subtitle";
  subtitle.textContent = book.author || "";

  meta.append(title, subtitle);
  link.append(cover, meta);
  card.append(link);

  return card;
};

const fetchOpenLibraryShelf = async (user, shelf) => {
  const url = `https://openlibrary.org/people/${user}/books/${shelf}.json`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Open Library error ${response.status}`);
  }

  const data = await response.json();
  const entries = data.reading_log_entries || [];

  return entries.map((entry) => ({
    title: entry.work?.title || "Untitled",
    author: (entry.work?.author_names || []).join(", "),
    coverUrl: entry.work?.cover_id
      ? `https://covers.openlibrary.org/b/id/${entry.work.cover_id}-M.jpg`
      : "",
    link: entry.work?.key ? `https://openlibrary.org${entry.work.key}` : "",
  }));
};

const buildGoogleBooksQuery = (title, author) => {
  const terms = [];

  if (title) terms.push(`intitle:${title}`);
  if (author) terms.push(`inauthor:${author}`);

  return terms.join(" ");
};

const fetchGoogleBooksCover = async (title, author) => {
  const query = buildGoogleBooksQuery(title, author);
  if (!query) return "";

  const url = `/api/books?${new URLSearchParams({
    q: query,
  })}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Books error ${response.status}`);
  }

  const data = await response.json();
  const item = data.items?.[0];
  const imageLinks = item?.volumeInfo?.imageLinks || {};
  const coverUrl =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.small ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail ||
    "";

  if (!coverUrl) return "";

  let upgraded = coverUrl.replace(/^http:/, "https:");

  try {
    const url = new URL(upgraded);
    if (url.hostname.includes("books.google") && url.searchParams.has("zoom")) {
      const zoom = url.searchParams.get("zoom");
      if (zoom === "1") url.searchParams.set("zoom", "2");
      upgraded = url.toString();
    }
  } catch (error) {
    // Keep original upgraded URL if parsing fails.
  }

  return upgraded;
};

const applyGoogleBooksCovers = async (books) =>
  Promise.all(
    books.map(async (book) => {
      try {
        const coverUrl = await fetchGoogleBooksCover(book.title, book.author);
        return { ...book, coverUrl: coverUrl || book.coverUrl };
      } catch (error) {
        return book;
      }
    })
  );

export const initBooks = async ({ liveDataEnabled = true } = {}) => {
  const listEl = document.querySelector("[data-books-list]");
  const statusEl = document.querySelector("[data-books-status]");

  if (!listEl || !statusEl) return;

  const limit = config.books.limit || 6;
  renderSkeleton(listEl, limit);

  if (!liveDataEnabled) {
    renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch books");
    statusEl.textContent = "Live data disabled.";
    return;
  }

  try {
    if (!config.books.openLibraryUser) {
      renderPlaceholder(
        listEl,
        limit,
        "Add Open Library username",
        "scripts/config.js"
      );
      statusEl.textContent =
        "Add your Open Library username in scripts/config.js.";
      return;
    }

    const [current, read] = await Promise.all([
      fetchOpenLibraryShelf(config.books.openLibraryUser, "currently-reading"),
      fetchOpenLibraryShelf(config.books.openLibraryUser, "already-read"),
    ]);

    const currentBooks = current.map((book) => ({
      ...book,
      status: "Now Reading",
    }));
    const readBooks = read.map((book) => ({
      ...book,
      status: "",
    }));

    let books = [...currentBooks, ...readBooks].slice(0, limit);
    books = await applyGoogleBooksCovers(books);

    if (!books.length) {
      renderPlaceholder(listEl, limit, "No books found", "Update Open Library");
      return;
    }

    statusEl.textContent =
      "Updated from Open Library; covers from Google Books when available.";

    const cards = books.map((book) => createBookCard(book));
    listEl.replaceChildren(...cards);
  } catch (error) {
    statusEl.textContent = "Could not load book list.";
    renderPlaceholder(listEl, limit, "Books unavailable", "Try again later");
  }
};
