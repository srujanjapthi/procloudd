#!/usr/bin/env node
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");

const REPO = "gitleaks/gitleaks";
const INSTALL_DIR = path.join(__dirname, "..", ".gitleaks-bin");
const BINARY_NAME = process.platform === "win32" ? "gitleaks.exe" : "gitleaks";
const BINARY_PATH = path.join(INSTALL_DIR, BINARY_NAME);

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "procloudd-installer" } }, (res) => {
        if (
          [301, 302, 303, 307, 308].includes(res.statusCode) &&
          res.headers.location &&
          redirects > 0
        ) {
          res.resume();
          resolve(get(res.headers.location, redirects - 1));
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Request failed: ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function platformAsset(version) {
  const platform = { win32: "windows", darwin: "darwin", linux: "linux" }[
    process.platform
  ];
  const arch = { x64: "x64", arm64: "arm64" }[process.arch];
  if (!platform || !arch) {
    throw new Error(`Unsupported platform/arch: ${process.platform}/${process.arch}`);
  }
  const ext = platform === "windows" ? "zip" : "tar.gz";
  return { filename: `gitleaks_${version}_${platform}_${arch}.${ext}`, ext };
}

async function main() {
  if (fs.existsSync(BINARY_PATH)) return;

  const release = JSON.parse(
    (await get(`https://api.github.com/repos/${REPO}/releases/latest`)).toString("utf-8")
  );
  const version = release.tag_name.replace(/^v/, "");
  const { filename, ext } = platformAsset(version);

  const asset = release.assets.find((a) => a.name === filename);
  const checksumsAsset = release.assets.find(
    (a) => a.name === `gitleaks_${version}_checksums.txt`
  );
  if (!asset || !checksumsAsset) {
    throw new Error(`Could not find release assets for ${filename}`);
  }

  const [archiveBuf, checksumsText] = await Promise.all([
    get(asset.browser_download_url),
    get(checksumsAsset.browser_download_url).then((b) => b.toString("utf-8")),
  ]);

  const expectedLine = checksumsText.split("\n").find((line) => line.includes(filename));
  if (!expectedLine) {
    throw new Error(`No checksum entry found for ${filename}`);
  }
  const expectedHash = expectedLine.trim().split(/\s+/)[0];
  const actualHash = crypto.createHash("sha256").update(archiveBuf).digest("hex");
  if (expectedHash !== actualHash) {
    throw new Error(
      `Checksum mismatch for ${filename}: expected ${expectedHash}, got ${actualHash}`
    );
  }

  fs.mkdirSync(INSTALL_DIR, { recursive: true });
  const archivePath = path.join(INSTALL_DIR, filename);
  fs.writeFileSync(archivePath, archiveBuf);

  if (ext === "zip") {
    execFileSync("powershell", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -Path "${archivePath}" -DestinationPath "${INSTALL_DIR}" -Force`,
    ]);
  } else {
    execFileSync("tar", ["-xzf", archivePath, "-C", INSTALL_DIR]);
  }
  fs.rmSync(archivePath);

  if (process.platform !== "win32") {
    fs.chmodSync(BINARY_PATH, 0o755);
  }

  console.log(`gitleaks ${version} installed to ${BINARY_PATH}`);
}

main().catch((error) => {
  console.warn(`Warning: gitleaks install skipped — ${error.message}`);
  console.warn("Local secret scanning will be unavailable; CI will still catch it.");
});
