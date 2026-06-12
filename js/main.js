const PHOTOGRAPHY_DIR = "images/photography/";
const ILLUSTRATIONS_DIR = "images/illustrations/";

const PHOTOGRAPHY = [
  "000061160024_websize.jpg",
  "000061160027_websize.jpg",
  "000061170004_websize.jpg",
  "000061170001_websize.jpg",
  { file: "000061170018_websize.jpg", full: true },
  "3134_03.jpg",
  "000061160009_websize.jpg",
  "000061160029_websize.jpg",
  "000061160036_websize.jpg",
  "3134_02.jpg",
  { file: "3134_26.jpg", full: true },
  "000061160008_websize.jpg",
  "000061170008_websize.jpg",
  "000061170010_websize.jpg",
  "000061170015_websize.jpg",
  "000061170006_websize.jpg",
  { file: "000061170019_websize.jpg", full: true },
  "000061170027_websize.jpg",
  "000061170035_websize.jpg",
  "000031850031_websize.jpg",
  "000061160017_websize.jpg",
  "000031850034_websize.jpg",
  { file: "000096500001_websize.jpg", full: true },
  "000096500006_websize.jpg",
  "000096500007_websize.jpg",
  "000096500010_websize.jpg",
  "000096500013_websize.jpg",
  "000096500015_websize.jpg",
  { file: "000096500016_websize.jpg", full: true },
  "000096500017_websize.jpg",
  "000096500022_websize.jpg",
  "000096500031_websize.jpg",
  "000096510001_websize.jpg",
  "000061160018_websize.jpg",
  { file: "000096510006_websize.jpg", full: true },
  "000096510008_websize.jpg",
  "000096510012_websize.jpg",
  "000096510028_websize.jpg",
  "3134_01.jpg",
  "000061160026_websize.jpg",
  { file: "3134_30.jpg", full: true },
  "3134_25.jpg",
  "3134_05.jpg",
  "3134_06.jpg",
  "3134_07.jpg",
  "3134_08.jpg",
  { file: "3134_09.jpg", full: true },
  "3134_10.jpg",
  "3134_11.jpg",
  "3134_12.jpg",
  "3134_13.jpg",
  "3134_14.jpg",
  { file: "3134_15.jpg", full: true },
  "3134_16.jpg",
  "3134_17.jpg",
  "3134_18.jpg",
  "3134_27.jpg",
  "3134_20.jpg",
  { file: "3134_21.jpg", full: true },
  "3134_22.jpg",
  "000096510005_websize.jpg",
  "3134_24.jpg",
  "000031850032_websize.jpg",
  "3134_04.jpg",
  { file: "3134_19.jpg", full: true },
  "3134_28.jpg",
  "3134_29.jpg",
  "3134_23.jpg",
  "3134_31.jpg",
  "3134_32.jpg",
  { file: "3134_33.jpg", full: true },
  "3134_34.jpg",
  "3134_35.jpg",
  "3134_36.jpg",
  "3134_37.jpg",
];

const ILLUSTRATIONS = ["img_6347.jpg"];

const DEFAULT_PANEL = "photography";
const SITE_TITLE = "Christopher Acciai";
const NOTES_HASH_PREFIX = "notes/";

const navItems = document.querySelectorAll(".nav-item[data-panel]");
const connectNav = document.querySelector('.nav-item[data-panel="connect"]');
const panels = document.querySelectorAll(".panel");
const page = document.querySelector(".page");
const siteLayout = document.querySelector(".site-layout");
const siteName = document.querySelector(".site-name");

let notesData = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatIndexDate(date) {
  if (!date) return "";
  if (/^\d{4}$/.test(date)) return date;

  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderIndexList(container, items, { emptyLabel, link = false, noteLink = false } = {}) {
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<p class="panel-empty">${emptyLabel}</p>`;
    return;
  }

  container.innerHTML = `<ul class="index-list">${items
    .map((item) => {
      const safeUrl =
        link && item.url && /^https?:\/\//i.test(item.url) ? item.url : "";
      let title;

      if (noteLink && item.slug) {
        title = `<a class="index-row__title" href="#notes/${encodeURIComponent(item.slug)}">${escapeHtml(item.title)}</a>`;
      } else if (safeUrl) {
        title = `<a class="index-row__title" href="${safeUrl.replaceAll('"', "%22")}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`;
      } else {
        title = `<span class="index-row__title">${escapeHtml(item.title)}</span>`;
      }

      return `<li class="index-row">${title}<span class="index-row__line" aria-hidden="true"></span><span class="index-row__meta">${escapeHtml(formatIndexDate(item.date))}</span></li>`;
    })
    .join("")}</ul>`;
}

function renderBooks(data) {
  const legacyItems =
    data?.sections?.flatMap((section) =>
      section.books.map((book) => ({
        title: book.title,
        date: book.date || section.year,
      }))
    ) || [];

  renderIndexList(document.getElementById("books-content"), data?.items || legacyItems, {
    emptyLabel: "No books yet.",
  });
}

function renderWritings(data) {
  renderIndexList(document.getElementById("writings-content"), data?.items || [], {
    emptyLabel: "No writings yet.",
    link: true,
  });
}

function getNoteSlugFromHash() {
  const hash = location.hash.slice(1);
  if (!hash.startsWith(NOTES_HASH_PREFIX)) return null;
  return decodeURIComponent(hash.slice(NOTES_HASH_PREFIX.length));
}

function renderNotesList() {
  renderIndexList(document.getElementById("notes-content"), notesData?.items || [], {
    emptyLabel: "No notes yet.",
    noteLink: true,
  });
}

function showNotesList() {
  if (location.hash.startsWith(`#${NOTES_HASH_PREFIX}`)) {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }

  renderNotesList();

  const notesNav = document.querySelector('.nav-item[data-panel="notes"]');
  if (notesNav?.classList.contains("is-active")) {
    document.title = `${SITE_TITLE} / Notes`;
  }
}

async function openNote(slug) {
  const container = document.getElementById("notes-content");
  if (!container) return;

  try {
    const response = await fetch(`data/notes/${encodeURIComponent(slug)}.json`);
    if (!response.ok) throw new Error("Note not found");

    const note = await response.json();
    container.innerHTML = `
      <article class="note-view">
        <header class="note-view__header">
          <button type="button" class="note-view__back">Notes</button>
          <span class="note-view__sep" aria-hidden="true">/</span>
          <span class="note-view__title">${escapeHtml(note.title)}</span>
        </header>
        <div class="note-body">${note.html || ""}</div>
      </article>`;

    container.querySelector(".note-view__back")?.addEventListener("click", showNotesList);

    const notesNav = document.querySelector('.nav-item[data-panel="notes"]');
    if (notesNav?.classList.contains("is-active")) {
      document.title = `${SITE_TITLE} / ${note.title}`;
    }
  } catch {
    showNotesList();
  }
}

function renderNotes() {
  const slug = getNoteSlugFromHash();
  if (slug) {
    openNote(slug);
    return;
  }

  showNotesList();
}

async function loadNotionContent() {
  const [booksResult, writingsResult, notesResult] = await Promise.allSettled([
    fetch("data/books.json").then((response) => response.json()),
    fetch("data/writings.json").then((response) => response.json()),
    fetch("data/notes.json").then((response) => response.json()),
  ]);

  if (booksResult.status === "fulfilled") {
    renderBooks(booksResult.value);
  }

  if (writingsResult.status === "fulfilled") {
    renderWritings(writingsResult.value);
  }

  if (notesResult.status === "fulfilled") {
    notesData = notesResult.value;
    const notesPanel = document.getElementById("notes");
    if (notesPanel && !notesPanel.hidden) {
      renderNotes();
    }
  }
}

function gallerySrc(dir, file, full) {
  const size = full ? "full" : "half";
  return `${dir}${size}/${file}`;
}

function renderGallery(galleryId, items, dir, alt) {
  const gallery = document.getElementById(galleryId);
  if (!gallery) return;

  gallery.innerHTML = items
    .map((entry, index) => {
      const file = typeof entry === "string" ? entry : entry.file;
      const full = typeof entry === "string" ? false : entry.full;
      const className = full
        ? "photo-gallery__item photo-gallery__item--full"
        : "photo-gallery__item";
      const eager = index < 4 ? ' fetchpriority="high"' : "";

      return `<figure class="${className}"><img data-src="${gallerySrc(dir, file, full)}" alt="${alt}" decoding="async"${eager}></figure>`;
    })
    .join("");
}

function renderPhotoGallery() {
  renderGallery("photo-gallery", PHOTOGRAPHY, PHOTOGRAPHY_DIR, "Film photograph");
}

function renderIllustrationGallery() {
  renderGallery("illustration-gallery", ILLUSTRATIONS, ILLUSTRATIONS_DIR, "Illustration");
}

function loadGalleryImage(img) {
  const src = img.getAttribute("data-src");
  if (!src) return;

  img.addEventListener(
    "load",
    () => {
      img.classList.add("is-loaded");
    },
    { once: true }
  );

  img.addEventListener(
    "error",
    () => {
      img.classList.remove("is-loaded");
    },
    { once: true }
  );

  img.src = src;
  img.removeAttribute("data-src");
}

function loadGalleryImages(gallery) {
  if (!gallery) return;
  gallery.querySelectorAll("img[data-src]").forEach(loadGalleryImage);
}

function setActiveSection(activeButton) {
  navItems.forEach((button) => {
    const isActive = button === activeButton;
    button.classList.toggle("is-active", isActive);
    if (isActive) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function activateNav(button) {
  const target = button.dataset.panel;
  const label = button.textContent.trim();

  setActiveSection(button);
  page.scrollTop = 0;

  if (target === "connect") {
    siteLayout?.classList.add("is-connect");
    page.classList.remove("has-section");
    panels.forEach((panel) => {
      panel.hidden = true;
      panel.classList.remove("is-active");
    });
    document.title = SITE_TITLE;
    return;
  }

  siteLayout?.classList.remove("is-connect");

  page.classList.add("has-section");
  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === target;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
  document.title = `${SITE_TITLE} / ${label}`;

  if (target === "notes") {
    renderNotes();
  }

  const activePanel = document.getElementById(target);
  activePanel?.querySelectorAll(".photo-gallery").forEach(loadGalleryImages);
}

navItems.forEach((button) => {
  button.addEventListener("click", () => {
    if (button.classList.contains("is-active") && button !== connectNav) {
      activateNav(connectNav);
    } else {
      activateNav(button);
    }
  });
});

siteName?.addEventListener("click", () => {
  activateNav(connectNav);
});

window.addEventListener("hashchange", () => {
  const slug = getNoteSlugFromHash();
  if (!slug) {
    const notesPanel = document.getElementById("notes");
    if (notesPanel && !notesPanel.hidden) {
      showNotesList();
    }
    return;
  }

  const notesNav = document.querySelector('.nav-item[data-panel="notes"]');
  if (notesNav && !notesNav.classList.contains("is-active")) {
    activateNav(notesNav);
    return;
  }

  openNote(slug);
});

renderPhotoGallery();
renderIllustrationGallery();
loadNotionContent();

const initialNoteSlug = getNoteSlugFromHash();
if (initialNoteSlug) {
  activateNav(document.querySelector('.nav-item[data-panel="notes"]'));
} else {
  activateNav(document.querySelector(`.nav-item[data-panel="${DEFAULT_PANEL}"]`));
}
