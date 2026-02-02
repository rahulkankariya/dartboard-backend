import { promises as fs } from "fs";
import * as path from "path";

const SRC_ROOT = path.resolve(process.cwd(), "src");
const DIST_SRC_ROOT = path.resolve(process.cwd(), "dist", "src");

// Add other static extensions if you need (e.g., ".mjml", ".txt", ".json", images, etc.)
const STATIC_EXTS = new Set<string>([".html"]);

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyFilePreserveTree(srcFile: string) {
  const rel = path.relative(SRC_ROOT, srcFile);
  const destFile = path.join(DIST_SRC_ROOT, rel);
  await ensureDir(path.dirname(destFile));
  await fs.copyFile(srcFile, destFile);
}

async function walk(dir: string, copied: { count: number }) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, copied);
    else if (
      entry.isFile() &&
      STATIC_EXTS.has(path.extname(entry.name).toLowerCase())
    ) {
      await copyFilePreserveTree(full);
      copied.count += 1;
    }
  }
}

(async () => {
  const copied = { count: 0 };
  await walk(SRC_ROOT, copied);
  console.log(`✅ Copied ${copied.count} static file(s) to ${DIST_SRC_ROOT}`);
})().catch((e) => {
  console.error("❌ copy-assets failed:", e);
  process.exit(1);
});
