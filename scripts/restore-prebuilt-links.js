// Ran by install.sh / install.ps1 (cwd = app dir) after copying
// prebuilt/.next to .next. Recreates the symlinks recorded by
// scripts/prepare-prebuilt.js — as real symlinks on macOS/Linux, and as
// directory copies on Windows (symlinks there need admin or developer mode).
const fs = require("fs");
const path = require("path");

const manifest = path.join(process.cwd(), "prebuilt", "links.json");
if (!fs.existsSync(manifest)) process.exit(0);

const links = JSON.parse(fs.readFileSync(manifest, "utf8"));
for (const { link, target } of links) {
  const linkPath = path.join(process.cwd(), ".next", link);
  const targetPath = path.resolve(path.dirname(linkPath), target);
  fs.rmSync(linkPath, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  if (process.platform === "win32") {
    fs.cpSync(targetPath, linkPath, { recursive: true });
  } else {
    fs.symlinkSync(target, linkPath);
  }
}
console.log(`restore-prebuilt-links: restored ${links.length} link(s)`);
