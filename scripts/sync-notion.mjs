#!/usr/bin/env node

import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOTION_VERSION = "2022-06-28";
const DATA_DIR = join(ROOT, "data");
const NOTES_DIR = join(DATA_DIR, "notes");

const token = process.env.NOTION_TOKEN;
const config = JSON.parse(
  readFileSync(join(ROOT, "notion.config.json"), "utf8")
);

async function notionFetch(path, options = {}) {
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || `Notion API error (${response.status})`);
  }
  return body;
}

function richText(items = []) {
  return items.map((item) => item.plain_text).join("");
}

function getTitle(properties) {
  const titleProp = Object.values(properties).find((prop) => prop.type === "title");
  return titleProp ? richText(titleProp.title) : "";
}

function getPlainText(properties, names) {
  for (const name of names) {
    const prop = properties[name];
    if (!prop) continue;

    if (prop.type === "rich_text") return richText(prop.rich_text);
    if (prop.type === "select") return prop.select?.name || "";
    if (prop.type === "number" && prop.number != null) return String(prop.number);
  }
  return "";
}

function getFinishedDate(properties, fallbackYear) {
  const finished = properties.Finished;
  if (finished?.type === "date" && finished.date?.start) {
    return finished.date.start;
  }

  const year = getPlainText(properties, ["Year", "year", "Read Year"]);
  if (year) return year;

  return fallbackYear;
}

function getDate(properties) {
  for (const name of ["Date", "date", "Written", "Published", "Published Date", "Added"]) {
    const prop = properties[name];
    if (prop?.type === "date" && prop.date?.start) {
      return prop.date.start;
    }
    if (prop?.type === "created_time" && prop.created_time) {
      return prop.created_time.slice(0, 10);
    }
  }
  return "";
}

function getStatus(properties) {
  return properties.Status?.status?.name || properties.Status?.select?.name || "";
}

function isPublished(properties) {
  const status = getStatus(properties);
  if (!status) return true;
  return status === "Finished" || status === "Published";
}

function getUrl(properties, page) {
  for (const name of ["URL", "Url", "Link", "link"]) {
    const prop = properties[name];
    if (prop?.type === "url" && prop.url) return prop.url;
  }
  return page.url || "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function slugify(title) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function assignSlugs(entries) {
  const seen = new Map();

  return entries.map((entry) => {
    const base = slugify(entry.title) || "untitled";
    let slug = base;
    let suffix = 2;

    while (seen.has(slug)) {
      slug = `${base}-${suffix++}`;
    }

    seen.set(slug, true);
    return { ...entry, slug };
  });
}

function renderRichText(items = []) {
  return items
    .map((item) => {
      let text = escapeHtml(item.plain_text);

      if (item.annotations?.code) text = `<code>${text}</code>`;
      if (item.annotations?.bold) text = `<strong>${text}</strong>`;
      if (item.annotations?.italic) text = `<em>${text}</em>`;
      if (item.annotations?.strikethrough) text = `<del>${text}</del>`;
      if (item.href) {
        text = `<a href="${escapeHtml(item.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      }

      return text;
    })
    .join("");
}

function renderBlock(block) {
  const type = block.type;
  const content = block[type];

  if (!content) return "";

  switch (type) {
    case "paragraph": {
      const text = renderRichText(content.rich_text);
      return text ? `<p>${text}</p>` : "";
    }
    case "heading_1":
      return `<h2>${renderRichText(content.rich_text)}</h2>`;
    case "heading_2":
      return `<h3>${renderRichText(content.rich_text)}</h3>`;
    case "heading_3":
      return `<h4>${renderRichText(content.rich_text)}</h4>`;
    case "quote":
      return `<blockquote><p>${renderRichText(content.rich_text)}</p></blockquote>`;
    case "code":
      return `<pre><code>${escapeHtml(content.rich_text.map((item) => item.plain_text).join(""))}</code></pre>`;
    case "divider":
      return "<hr>";
    case "image": {
      const source = content.file?.url || content.external?.url;
      const caption = renderRichText(content.caption);
      if (!source) return "";
      return `<figure><img src="${escapeHtml(source)}" alt="${caption || ""}">${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
    }
    case "callout":
      return `<aside><p>${renderRichText(content.rich_text)}</p></aside>`;
    case "bulleted_list_item":
    case "numbered_list_item":
      return renderListItem(block);
    default:
      return "";
  }
}

function renderListItem(block) {
  const content = block[block.type];
  const text = renderRichText(content.rich_text);
  const children = block.children?.length
    ? blocksToHtml(block.children)
    : "";

  return `<li>${text}${children}</li>`;
}

function blocksToHtml(blocks) {
  const parts = [];
  let index = 0;

  while (index < blocks.length) {
    const block = blocks[index];

    if (block.type === "bulleted_list_item") {
      const items = [];
      while (index < blocks.length && blocks[index].type === "bulleted_list_item") {
        items.push(renderListItem(blocks[index]));
        index += 1;
      }
      parts.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (block.type === "numbered_list_item") {
      const items = [];
      while (index < blocks.length && blocks[index].type === "numbered_list_item") {
        items.push(renderListItem(blocks[index]));
        index += 1;
      }
      parts.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    const html = renderBlock(block);
    if (html) parts.push(html);
    index += 1;
  }

  return parts.join("\n");
}

async function getAllBlocks(blockId) {
  const blocks = [];
  let cursor;

  do {
    const query = cursor ? `?start_cursor=${cursor}` : "";
    const body = await notionFetch(`/blocks/${blockId}/children${query}`);

    for (const block of body.results) {
      if (block.has_children) {
        block.children = await getAllBlocks(block.id);
      }
      blocks.push(block);
    }

    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

async function queryDatabase(databaseId) {
  const pages = [];
  let cursor;

  do {
    const body = await notionFetch(`/databases/${databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({
        page_size: 100,
        start_cursor: cursor,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      }),
    });

    pages.push(...body.results);
    cursor = body.has_more ? body.next_cursor : undefined;
  } while (cursor);

  return pages;
}

function sortKey(date) {
  return /^\d{4}$/.test(date) ? `${date}-12-31` : date;
}

function mapBooks(pages, fallbackYear) {
  return pages
    .map((page) => {
      const title = getTitle(page.properties);
      if (!title) return null;

      return {
        title,
        date: getFinishedDate(page.properties, fallbackYear),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        sortKey(b.date).localeCompare(sortKey(a.date)) ||
        a.title.localeCompare(b.title)
    );
}

function mapWritings(pages) {
  const items = [];

  for (const page of pages) {
    const title = getTitle(page.properties);
    const status = getStatus(page.properties);

    if (!isPublished(page.properties)) {
      console.log(
        `Skipping writing "${title || "untitled"}": status is "${status}" (set to Finished to publish)`
      );
      continue;
    }

    if (!title) {
      console.log("Skipping writing with no title");
      continue;
    }

    items.push({
      title,
      date: getDate(page.properties),
      url: getUrl(page.properties, page),
    });
  }

  return items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
}

async function syncNotes(pages) {
  mkdirSync(NOTES_DIR, { recursive: true });

  const drafts = [];

  for (const page of pages) {
    const title = getTitle(page.properties);
    const status = getStatus(page.properties);

    if (!isPublished(page.properties)) {
      console.log(
        `Skipping note "${title || "untitled"}": status is "${status}" (set to Finished to publish)`
      );
      continue;
    }

    if (!title) {
      console.log("Skipping note with no title");
      continue;
    }

    drafts.push({
      pageId: page.id,
      title,
      date: getDate(page.properties),
    });
  }

  drafts.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  const entries = assignSlugs(drafts);
  const activeSlugs = new Set();

  for (const entry of entries) {
    activeSlugs.add(entry.slug);
    const blocks = await getAllBlocks(entry.pageId);

    writeFileSync(
      join(NOTES_DIR, `${entry.slug}.json`),
      `${JSON.stringify(
        {
          title: entry.title,
          date: entry.date,
          slug: entry.slug,
          html: blocksToHtml(blocks),
        },
        null,
        2
      )}\n`
    );
  }

  for (const file of readdirSync(NOTES_DIR)) {
    if (!file.endsWith(".json")) continue;
    const slug = file.slice(0, -".json".length);
    if (!activeSlugs.has(slug)) {
      unlinkSync(join(NOTES_DIR, file));
    }
  }

  return entries.map(({ title, date, slug }) => ({ title, date, slug }));
}

async function discover() {
  if (!token) {
    console.error("Set NOTION_TOKEN to discover accessible Notion content.");
    process.exit(1);
  }

  const body = await notionFetch("/search", {
    method: "POST",
    body: JSON.stringify({ page_size: 100 }),
  });

  if (!body.results.length) {
    console.log("No pages or databases found.");
    console.log("Share your Books, Writings, and Notes databases with your Notion connection:");
    console.log("Database menu → Add connections → Personal Website Connection");
    return;
  }

  for (const item of body.results) {
    const title =
      item.object === "database"
        ? richText(item.title)
        : getTitle(item.properties || {});

    console.log(`${item.object}\t${item.id}\t${title}`);
  }
}

async function syncDatabase(databaseId, label) {
  if (!databaseId) {
    console.log(`Skipping ${label}: no database ID in notion.config.json`);
    return null;
  }

  console.log(`Syncing ${label}...`);
  return queryDatabase(databaseId);
}

async function main() {
  if (process.argv.includes("--discover")) {
    await discover();
    return;
  }

  if (!token) {
    console.error("Set NOTION_TOKEN before running sync-notion.mjs");
    process.exit(1);
  }

  mkdirSync(DATA_DIR, { recursive: true });

  const booksPages = await syncDatabase(config.booksDatabaseId, "books");
  const writingsPages = await syncDatabase(config.writingsDatabaseId, "writings");
  const notesPages = await syncDatabase(config.notesDatabaseId, "notes");

  if (booksPages) {
    const fallbackYear = config.booksDefaultYear || String(new Date().getFullYear());
    writeFileSync(
      join(DATA_DIR, "books.json"),
      `${JSON.stringify({ items: mapBooks(booksPages, fallbackYear) }, null, 2)}\n`
    );
    console.log(`Wrote ${booksPages.length} book entries`);
  }

  if (writingsPages) {
    const writings = mapWritings(writingsPages);
    writeFileSync(
      join(DATA_DIR, "writings.json"),
      `${JSON.stringify({ items: writings }, null, 2)}\n`
    );
    console.log(`Published ${writings.length} of ${writingsPages.length} writings`);
  }

  if (notesPages) {
    const notes = await syncNotes(notesPages);
    writeFileSync(
      join(DATA_DIR, "notes.json"),
      `${JSON.stringify({ items: notes }, null, 2)}\n`
    );
    console.log(`Published ${notes.length} of ${notesPages.length} notes`);
  }

  if (!booksPages && !writingsPages && !notesPages) {
    console.error("Add database IDs to notion.config.json, then run again.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
