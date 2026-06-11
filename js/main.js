const PHOTOGRAPHY_DIR = "images/photography/";

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

const DEFAULT_PANEL = "photography";
const SITE_TITLE = "Christopher Acciai";

const navItems = document.querySelectorAll(".nav-item[data-panel]");
const connectNav = document.querySelector('.nav-item[data-panel="connect"]');
const panels = document.querySelectorAll(".panel");
const page = document.querySelector(".page");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatWritingDate(date) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderBooks(data) {
  const container = document.getElementById("books-content");
  if (!container) return;

  const sections = data?.sections || [];
  if (!sections.length) {
    container.innerHTML = '<p class="panel-empty">No books yet.</p>';
    return;
  }

  container.innerHTML = sections
    .map(
      (section) => `
        <div class="section">
          <h2 class="section-title">${escapeHtml(section.year)}</h2>
          ${section.books
            .map(
              (book) =>
                `<p class="book-title">${escapeHtml(book.title)}</p>`
            )
            .join("")}
        </div>`
    )
    .join("");
}

function renderWritings(data) {
  const container = document.getElementById("writings-content");
  if (!container) return;

  const items = data?.items || [];
  if (!items.length) {
    container.innerHTML = '<p class="panel-empty">No writings yet.</p>';
    return;
  }

  container.innerHTML = `
    <div class="section">
      <h2 class="section-title">Writings</h2>
      ${items
        .map((item) => {
          const safeUrl =
            item.url && /^https?:\/\//i.test(item.url) ? item.url : "";
          const label = safeUrl
            ? `<a href="${safeUrl.replaceAll('"', "%22")}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
            : escapeHtml(item.title);

          return `
            <article class="entry">
              <p class="entry-date">${escapeHtml(formatWritingDate(item.date))}</p>
              <div class="entry-details">
                <p class="entry-role writing-title">${label}</p>
              </div>
            </article>`;
        })
        .join("")}
    </div>`;
}

async function loadNotionContent() {
  const [booksResult, writingsResult] = await Promise.allSettled([
    fetch("data/books.json").then((response) => response.json()),
    fetch("data/writings.json").then((response) => response.json()),
  ]);

  if (booksResult.status === "fulfilled") {
    renderBooks(booksResult.value);
  }

  if (writingsResult.status === "fulfilled") {
    renderWritings(writingsResult.value);
  }
}

function photoSrc(file, full) {
  const size = full ? "full" : "half";
  return `${PHOTOGRAPHY_DIR}${size}/${file}`;
}

function renderPhotoGallery() {
  const gallery = document.getElementById("photo-gallery");
  if (!gallery) return;

  gallery.innerHTML = PHOTOGRAPHY.map((entry, index) => {
    const file = typeof entry === "string" ? entry : entry.file;
    const full = typeof entry === "string" ? false : entry.full;
    const className = full
      ? "photo-gallery__item photo-gallery__item--full"
      : "photo-gallery__item";
    const eager = index < 4 ? ' fetchpriority="high"' : "";

    return `<figure class="${className}"><img data-src="${photoSrc(file, full)}" alt="Film photograph" decoding="async"${eager}></figure>`;
  }).join("");

  lazyLoadGalleryImages(gallery);
}

function lazyLoadGalleryImages(gallery) {
  const images = gallery.querySelectorAll("img[data-src]");

  if (!("IntersectionObserver" in window)) {
    images.forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute("data-src");
      img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute("data-src");
        img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });
        observer.unobserve(img);
      });
    },
    { root: page, rootMargin: "400px 0px" }
  );

  images.forEach((img) => observer.observe(img));
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
    page.classList.remove("has-section");
    panels.forEach((panel) => {
      panel.hidden = true;
      panel.classList.remove("is-active");
    });
    document.title = SITE_TITLE;
    return;
  }

  page.classList.add("has-section");
  panels.forEach((panel) => {
    const isActive = panel.dataset.panel === target;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });
  document.title = `${SITE_TITLE} / ${label}`;
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

renderPhotoGallery();
loadNotionContent();
activateNav(document.querySelector(`.nav-item[data-panel="${DEFAULT_PANEL}"]`));
