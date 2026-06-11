#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const NOTION_VERSION = "2022-06-28";
const DATA_DIR = join(ROOT, "data");

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

function getYear(properties, fallbackYear) {
  const fromNumber = getPlainText(properties, ["Year", "year", "Read Year"]);
  if (fromNumber) return fromNumber;

  for (const name of ["Finished", "Date", "date", "Read"]) {
    const prop = properties[name];
    if (prop?.type === "date" && prop.date?.start) {
      return prop.date.start.slice(0, 4);
    }
  }

  return fallbackYear;
}

function getDate(properties) {
  for (const name of ["Date", "date", "Published", "Published Date", "Added"]) {
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

function isPublishedWriting(properties) {
  const status = properties.Status?.status?.name || properties.Status?.select?.name;
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

function groupBooks(pages, fallbackYear) {
  const groups = new Map();

  for (const page of pages) {
    const title = getTitle(page.properties);
    if (!title) continue;

    const year = getYear(page.properties, fallbackYear);
    if (!groups.has(year)) groups.set(year, []);
    groups.get(year).push({ title, year });
  }

  return [...groups.entries()]
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, books]) => ({
      year,
      books: books.sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

function mapWritings(pages) {
  return pages
    .map((page) => {
      if (!isPublishedWriting(page.properties)) return null;

      const title = getTitle(page.properties);
      if (!title) return null;

      const date = getDate(page.properties);
      const url = getUrl(page.properties, page);
      return { title, date, url };
    })
    .filter(Boolean)
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
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
    console.log("Share your Books and Writings databases with your Notion connection:");
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

  if (booksPages) {
    const fallbackYear = config.booksDefaultYear || String(new Date().getFullYear());
    writeFileSync(
      join(DATA_DIR, "books.json"),
      `${JSON.stringify({ sections: groupBooks(booksPages, fallbackYear) }, null, 2)}\n`
    );
    console.log(`Wrote ${booksPages.length} book entries`);
  }

  if (writingsPages) {
    writeFileSync(
      join(DATA_DIR, "writings.json"),
      `${JSON.stringify({ items: mapWritings(writingsPages) }, null, 2)}\n`
    );
    console.log(`Wrote ${writingsPages.length} writing entries`);
  }

  if (!booksPages && !writingsPages) {
    console.error("Add database IDs to notion.config.json, then run again.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
