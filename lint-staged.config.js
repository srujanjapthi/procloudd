const path = require("node:path");
const { spawnSync } = require("node:child_process");

// On Windows, npx is a .cmd shim that spawnSync can't invoke without
// shell:true, and shell:true requires a single pre-quoted command string
// rather than an args array (Node can't safely join+quote an array itself).
function run(cwd, bin, args) {
  if (process.platform === "win32") {
    const quotedArgs = args.map((a) => JSON.stringify(a)).join(" ");
    return spawnSync(`${bin} ${quotedArgs}`, { cwd, stdio: "inherit", shell: true });
  }
  return spawnSync(bin, args, { cwd, stdio: "inherit" });
}

function eslintAndPrettier(prefix) {
  return (filenames) => {
    if (filenames.length === 0) return [];

    const cwd = path.join(__dirname, prefix);
    const relative = filenames.map((f) => path.relative(cwd, f));

    for (const [bin, args] of [
      ["eslint", ["--fix", ...relative]],
      ["prettier", ["--write", ...relative]],
    ]) {
      const result = run(cwd, "npx", [bin, ...args]);
      if (result.status !== 0) {
        throw new Error(`${bin} failed in ${prefix}`);
      }
    }

    return [];
  };
}

module.exports = {
  "client/**/*.{ts,tsx}": eslintAndPrettier("client"),
  "server/**/*.ts": eslintAndPrettier("server"),
};
