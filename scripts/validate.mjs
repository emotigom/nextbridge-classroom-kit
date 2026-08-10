import { readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import process from "node:process";

const root = new URL("../", import.meta.url);
const errors = [];

const requiredManifestKeys = [
  "schemaVersion",
  "id",
  "version",
  "title",
  "publisher",
  "status",
  "delivery",
  "privacy",
  "integration"
];

function fail(message) {
  errors.push(message);
}

function isSemver(value) {
  return /^\d+\.\d+\.\d+$/.test(value);
}

let brand;
let catalog;
try {
  brand = JSON.parse(await readFile(new URL("config/brand.json", root), "utf8"));
  catalog = JSON.parse(await readFile(new URL("programs/catalog.json", root), "utf8"));
} catch (error) {
  fail(`브랜드 또는 프로그램 목록을 읽을 수 없습니다. ${error.message}`);
}

if (brand?.name !== "Nextbridge") fail("config/brand.json의 name은 Nextbridge여야 합니다.");
if (catalog?.publisher !== brand?.name) fail("catalog publisher와 brand name이 일치해야 합니다.");

const programIds = catalog?.programs?.map(({ id }) => id) ?? [];
if (programIds.length !== 3) fail("현재 foundation에는 프로그램 세 개가 있어야 합니다.");
if (new Set(programIds).size !== programIds.length) fail("catalog에 중복 프로그램 ID가 있습니다.");

for (const programId of programIds) {
  const path = new URL(`programs/${programId}/manifest.json`, root);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    fail(`${programId}: manifest.json을 읽을 수 없습니다. ${error.message}`);
    continue;
  }

  for (const key of requiredManifestKeys) {
    if (!(key in manifest)) fail(`${programId}: ${key} 필드가 없습니다.`);
  }
  if (manifest.schemaVersion !== "1.0") fail(`${programId}: schemaVersion은 1.0이어야 합니다.`);
  if (manifest.id !== programId) fail(`${programId}: 폴더명과 manifest id가 다릅니다.`);
  if (!isSemver(manifest.version)) fail(`${programId}: version은 x.y.z 형식이어야 합니다.`);
  if (manifest.publisher !== brand?.name) fail(`${programId}: publisher는 Nextbridge여야 합니다.`);
  if (manifest.privacy?.piiAllowed !== false) fail(`${programId}: piiAllowed는 false여야 합니다.`);
  if (manifest.privacy?.syntheticDataOnly !== true) fail(`${programId}: syntheticDataOnly는 true여야 합니다.`);
  if (manifest.delivery?.offlineCore !== true) fail(`${programId}: foundation 단계에서는 offlineCore가 true여야 합니다.`);
  if (manifest.integration?.gomCleanEnabled !== false) fail(`${programId}: 검토 전 gom-clean 연동을 켤 수 없습니다.`);
}

for (const schema of ["program-manifest.schema.json", "result-card.schema.json"]) {
  try {
    JSON.parse(await readFile(new URL(`schemas/${schema}`, root), "utf8"));
  } catch (error) {
    fail(`${schema}: 유효한 JSON이 아닙니다. ${error.message}`);
  }
}

const excludedDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const textExtensions = new Set([".js", ".mjs", ".json", ".md", ".html", ".css", ".yml", ".yaml"]);
const secretPatterns = [
  { name: "OpenAI key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "GitHub token", regex: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g },
  { name: "JWT-like value", regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g },
  { name: "private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "server secret assignment", regex: /(?:SERVICE_ROLE_KEY|OPENAI_API_KEY|PROXY_TOKEN|HMAC_SECRET)\s*=\s*[^\s<>{}\[\]]{12,}/g }
];

async function scan(directoryUrl) {
  for (const entry of await readdir(directoryUrl, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directoryUrl);
    if (entry.isDirectory()) {
      await scan(url);
      continue;
    }
    const extension = entry.name.includes(".") ? `.${entry.name.split(".").pop()}` : "";
    if (!textExtensions.has(extension) && entry.name !== "LICENSE") continue;
    const content = await readFile(url, "utf8");
    const displayPath = relative(join(new URL(root).pathname), url.pathname);
    for (const pattern of secretPatterns) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(content)) fail(`${displayPath}: ${pattern.name}로 보이는 값이 있습니다.`);
    }
  }
}

await scan(root);

if (errors.length) {
  console.error("\nValidation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validation passed.");
console.log(`- publisher: ${brand.name}`);
console.log(`- ${programIds.length} program manifests`);
console.log("- 2 JSON schemas");
console.log("- privacy defaults locked");
console.log("- gom-clean integration disabled");
console.log("- no secret-like values detected");
