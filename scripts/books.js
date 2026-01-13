import { config } from "./config.js";
import {
  renderSkeleton,
  renderPlaceholder,
  createMediaCard,
  finishLoading,
} from "./utils/cards.js";
import { fetchWithRetry, formatTimestamp } from "./utils/fetch.js";

const updateStatus = (statusEl, message, timestamp = null, onRetry = null) => {
  if (!statusEl) return;

  statusEl.innerHTML = "";
  statusEl.textContent = message;

  if (timestamp) {
    const timeEl = document.createElement("span");
    timeEl.className = "section-timestamp";
    timeEl.textContent = `(${formatTimestamp(timestamp)})`;
    statusEl.append(timeEl);
  }

  if (onRetry) {
    const retryBtn = document.createElement("button");
    retryBtn.className = "retry-button";
    retryBtn.textContent = "Retry";
    retryBtn.onclick = onRetry;
    statusEl.append(" ", retryBtn);
  }
};

const fetchOpenLibraryShelf = async (user, shelf) => {
  const url = `https://openlibrary.org/people/${user}/books/${shelf}.json`;
  const response = await fetchWithRetry(url);

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

  const response = await fetchWithRetry(url);
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

  const loadData = async () => {
    renderSkeleton(listEl, limit);
    updateStatus(statusEl, "Loading books.");

    if (!liveDataEnabled) {
      renderPlaceholder(listEl, limit, "Live data off", "Enable to fetch books");
      updateStatus(statusEl, "Live data disabled.");
      return;
    }

    if (!config.books.openLibraryUser) {
      renderPlaceholder(
        listEl,
        limit,
        "Add Open Library username",
        "scripts/config.js"
      );
      updateStatus(
        statusEl,
        "Add your Open Library username in scripts/config.js."
      );
      return;
    }

    try {
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
        updateStatus(statusEl, "No books found.", new Date(), loadData);
        return;
      }

      const cards = books.map((book) =>
        createMediaCard({
          href: book.link || "#",
          coverUrl: book.coverUrl,
          coverAlt: book.title ? `${book.title} cover` : "Book cover",
          title: book.title || "Untitled",
          subtitle: book.author || "",
          badge: book.status || null,
          coverClass: "media-card__cover--tall",
        })
      );

      listEl.replaceChildren(...cards);
      finishLoading(listEl);
      updateStatus(
        statusEl,
        "Updated from Open Library; covers from Google Books when available.",
        new Date()
      );
    } catch (error) {
      renderPlaceholder(listEl, limit, "Books unavailable", "Try again later");
      updateStatus(statusEl, "Could not load book list.", null, loadData);
    }
  };

  await loadData();
};
