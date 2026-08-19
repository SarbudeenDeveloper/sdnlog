// Ran by `npm run release` after the build is copied into prebuilt/.next.
// Committed symlinks break on Windows (git materializes them as text files),
// so record them in prebuilt/links.json and strip them from the snapshot;
// installers recreate them via scripts/restore-prebuilt-links.js.
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "prebuilt", ".next");
const links = [];

(function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.lstatSync(p);
    if (st.isSymbolicLink()) {
      links.push({
        link: path.relative(root, p).split(path.sep).join("/"),
        target: fs.readlinkSync(p).split(path.sep).join("/"),
      });
      fs.unlinkSync(p);
    } else if (st.isDirectory()) {
      walk(p);
    }
  }
})(root);

fs.writeFileSync(
  path.join(__dirname, "..", "prebuilt", "links.json"),
  JSON.stringify(links, null, 2) + "\n"
);
console.log(`prepare-prebuilt: recorded ${links.length} symlink(s) in prebuilt/links.json`);
