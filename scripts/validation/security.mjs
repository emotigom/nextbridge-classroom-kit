import { access, readFile, readdir } from "node:fs/promises";
import { extname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const requiredDocs = [
  "docs/program-status.md",
  "docs/result-card-contract.md",
  "docs/instructor-quick-start.md",
  "docs/recovery-card.md"
];
const excluded = new Set([".git", "node_modules", "dist", "coverage"]);
const textExtensions = new Set([
  ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".json", ".md",
  ".txt", ".html", ".css", ".yml", ".yaml", ".toml", ".xml"
]);
const fixedMarkers = [
  ["-----BEGIN ", "PRIVATE KEY-----"].join(""),
  ["-----BEGIN RSA ", "PRIVATE KEY-----"].join(""),
  ["-----BEGIN EC ", "PRIVATE KEY-----"].join(""),
  ["-----BEGIN OPENSSH ", "PRIVATE KEY-----"].join(""),
  ["SERVICE_ROLE", "_KEY="].join(""),
  ["OPENAI_API", "_KEY="].join(""),
  ["PROXY", "_TOKEN="].join(""),
  ["HMAC", "_SECRET="].join("")
];

function hasLongToken(content, prefix, minimum) {
  let start = content.indexOf(prefix);
  while (start !== -1) {
    let end = start + prefix.length;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
    while (end < content.length && alphabet.includes(content[end])) end += 1;
    if (end - start >= minimum) return true;
    start = content.indexOf(prefix, start + 1);
  }
  return false;
}

function hasJwtLikeValue(content) {
  for (const word of content.split(/\s+/)) {
    if (!word.startsWith("eyJ")) continue;
    const parts = word.replace(/["',;)}\]]+$/g, "").split(".");
    if (
      parts.length === 3 && parts[0].length >= 20 &&
      parts[1].length >= 20 && parts[2].length >= 10
    ) return true;
  }
  return false;
}

export async function validateSecurity(root, fail) {
  for (const path of requiredDocs) {
    try {
      await access(new URL(path, root));
    } catch {
      fail(`${path}: 필수 운영 문서가 없습니다.`);
    }
  }

  try {
    const stub = await readFile(new URL("src/adapters/gom-clean.stub.js", root), "utf8");
    if (!stub.includes("enabled: false")) {
      fail("gom-clean adapter는 enabled: false여야 합니다.");
    }
    if (stub.includes("fetch(")) {
      fail("gom-clean adapter에 네트워크 요청을 만들 수 없습니다.");
    }
  } catch (error) {
    fail(`gom-clean adapter를 확인할 수 없습니다. ${error.message}`);
  }

  const rootPath = fileURLToPath(root);
  async function scan(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && excluded.has(entry.name)) continue;
      const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
      if (entry.isDirectory()) {
        await scan(url);
        continue;
      }
      if (
        !textExtensions.has(extname(entry.name)) &&
        entry.name !== "LICENSE" && !entry.name.startsWith(".env")
      ) continue;

      const content = await readFile(url, "utf8");
      const path = relative(rootPath, fileURLToPath(url));
      if (fixedMarkers.some((marker) => content.includes(marker))) {
        fail(`${path}: 비밀정보 할당 또는 개인키로 보이는 값이 있습니다.`);
      }
      if (hasLongToken(content, "sk-", 23)) {
        fail(`${path}: OpenAI key로 보이는 값이 있습니다.`);
      }
      if (
        hasLongToken(content, "ghp_", 24) ||
        hasLongToken(content, "github_pat_", 31)
      ) fail(`${path}: GitHub token으로 보이는 값이 있습니다.`);
      if (hasJwtLikeValue(content)) fail(`${path}: JWT처럼 보이는 값이 있습니다.`);
    }
  }

  await scan(root);
}
