#!/usr/bin/env node
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function printHelp() {
  console.log(`Usage:
  node capture-page.mjs --url <https://example.com> [--format png|pdf] [--output <path>]

Options:
  --url              URL to capture (required)
  --format           png (default) or pdf
  --output           Output file path
  --delay            Seconds to wait after load (default: 2)
  --timeout          Navigation timeout in seconds (default: 60)
  --width            Viewport width for capture (default: 1440)
  --height           Viewport height for capture (default: 2200)
  --no-auto-scroll   Disable auto-scroll before capture
  --help             Show help
`);
}

function parseArgs(argv) {
  const parsed = {
    url: "",
    format: "png",
    output: "",
    delay: 2,
    timeout: 60,
    width: 1440,
    height: 2200,
    autoScroll: true,
    help: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];

    if (key === "--help" || key === "-h") {
      parsed.help = true;
      continue;
    }

    if (key === "--no-auto-scroll") {
      parsed.autoScroll = false;
      continue;
    }

    if (key === "--url" && next) {
      parsed.url = next;
      i += 1;
      continue;
    }

    if (key === "--format" && next) {
      parsed.format = next.toLowerCase();
      i += 1;
      continue;
    }

    if (key === "--output" && next) {
      parsed.output = next;
      i += 1;
      continue;
    }

    if (key === "--delay" && next) {
      parsed.delay = Number(next);
      i += 1;
      continue;
    }

    if (key === "--timeout" && next) {
      parsed.timeout = Number(next);
      i += 1;
      continue;
    }

    if (key === "--width" && next) {
      parsed.width = Number(next);
      i += 1;
      continue;
    }

    if (key === "--height" && next) {
      parsed.height = Number(next);
      i += 1;
      continue;
    }
  }

  return parsed;
}

function safeName(input) {
  return input.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function defaultOutputPath(urlString, format) {
  const parsed = new URL(urlString);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const host = safeName(parsed.hostname || "page");
  const fileName = `${host}-${timestamp}.${format}`;
  const capturesDir = path.resolve("C:\\Users\\robku\\OneDrive\\Desktop\\FULL screenshots");
  return path.join(capturesDir, fileName);
}

async function autoScroll(page, viewportHeight) {
  const step = Math.max(400, Math.floor(viewportHeight * 0.8));
  await page.evaluate(async ({ stepPx }) => {
    await new Promise((resolve) => {
      let total = 0;
      const max = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      const timer = setInterval(() => {
        window.scrollBy(0, stepPx);
        total += stepPx;
        if (total >= max) {
          clearInterval(timer);
          resolve();
        }
      }, 120);
    });
  }, { stepPx: step });

  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
}

async function launchBrowser() {
  const attempts = [
    { label: "Microsoft Edge", options: { headless: true, channel: "msedge" } },
    { label: "Google Chrome", options: { headless: true, channel: "chrome" } },
  ];

  const failures = [];

  for (const attempt of attempts) {
    try {
      return await chromium.launch(attempt.options);
    } catch (err) {
      failures.push(`${attempt.label}: ${err.message}`);
    }
  }

  throw new Error(
    "Unable to launch a Chromium browser. Ensure Edge or Chrome is installed.\n" + failures.join("\n")
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.url) {
    printHelp();
    throw new Error("Missing required argument: --url");
  }

  let validatedUrl;
  try {
    validatedUrl = new URL(args.url);
  } catch {
    throw new Error(`Invalid URL: ${args.url}`);
  }

  if (!["png", "pdf"].includes(args.format)) {
    throw new Error("--format must be one of: png, pdf");
  }

  if (!Number.isFinite(args.delay) || args.delay < 0) {
    throw new Error("--delay must be a non-negative number");
  }

  if (!Number.isFinite(args.timeout) || args.timeout <= 0) {
    throw new Error("--timeout must be a positive number");
  }

  if (!Number.isFinite(args.width) || args.width < 320) {
    throw new Error("--width must be at least 320");
  }

  if (!Number.isFinite(args.height) || args.height < 320) {
    throw new Error("--height must be at least 320");
  }

  const outputPath = path.resolve(args.output || defaultOutputPath(validatedUrl.toString(), args.format));
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const browser = await launchBrowser();

  try {
    const context = await browser.newContext({
      viewport: { width: args.width, height: args.height },
      javaScriptEnabled: true,
    });

    const page = await context.newPage();

    await page.goto(validatedUrl.toString(), {
      waitUntil: "networkidle",
      timeout: args.timeout * 1000,
    });

    if (args.autoScroll) {
      await autoScroll(page, args.height);
    }

    if (args.delay > 0) {
      await page.waitForTimeout(args.delay * 1000);
    }

    if (args.format === "png") {
      await page.screenshot({
        path: outputPath,
        fullPage: true,
        type: "png",
      });
    } else {
      await page.emulateMedia({ media: "screen" });
      await page.pdf({
        path: outputPath,
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: "0.4in",
          right: "0.4in",
          bottom: "0.4in",
          left: "0.4in",
        },
      });
    }

    console.log(outputPath);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(`[capture-page] ${err.message}`);
  process.exit(1);
});
