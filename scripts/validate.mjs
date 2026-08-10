import { access, readFile, readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import process from "node:process";

const root = new URL("../", import.meta.url);
const errors = [];
const expectedResultSchemaVersion = "1.1";

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
let resultSchema;
try {
  brand = JSON.parse(await readFile(new URL("config/brand.json", root), "utf8"));
  catalog = JSON.parse(await readFile(new URL("programs/catalog.json", root), "utf8"));
  resultSchema = JSON.parse(await readFile(new URL("schemas/result-card.schema.json", root), "utf8"));
} catch (error) {
  fail(`브랜드, 프로그램 목록 또는 결과카드 스키마를 읽을 수 없습니다. ${error.message}`);
}

if (brand?.name !== "Nextbridge") fail("config/brand.json의 name은 Nextbridge여야 합니다.");
if (catalog?.publisher !== brand?.name) fail("catalog publisher와 brand name이 일치해야 합니다.");
if (resultSchema?.properties?.schemaVersion?.const !== expectedResultSchemaVersion) {
  fail(`결과카드 schemaVersion은 ${expectedResultSchemaVersion}이어야 합니다.`);
}

const programIds = catalog?.programs?.map(({ id }) => id) ?? [];
if (programIds.length !== 3) fail("현재 foundation에는 프로그램 세 개가 있어야 합니다.");
if (new Set(programIds).size !== programIds.length) fail("catalog에 중복 프로그램 ID가 있습니다.");

for (const entry of catalog?.programs ?? []) {
  const expectedManifest = `./${entry.id}/manifest.json`;
  if (entry.manifest !== expectedManifest) {
    fail(`${entry.id}: catalog manifest 경로는 ${expectedManifest}이어야 합니다.`);
  }

  const path = new URL(`programs/${entry.id}/manifest.json`, root);
  let manifest;
  try {
    manifest = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    fail(`${entry.id}: manifest.json을 읽을 수 없습니다. ${error.message}`);
    continue;
  }

  for (const key of requiredManifestKeys) {
    if (!(key in manifest)) fail(`${entry.id}: ${key} 필드가 없습니다.`);
  }
  if (manifest.schemaVersion !== "1.0") fail(`${entry.id}: schemaVersion은 1.0이어야 합니다.`);
  if (manifest.id !== entry.id) fail(`${entry.id}: 폴더명과 manifest id가 다릅니다.`);
  if (!isSemver(manifest.version)) fail(`${entry.id}: version은 x.y.z 형식이어야 합니다.`);
  if (manifest.publisher !== brand?.name) fail(`${entry.id}: publisher는 Nextbridge여야 합니다.`);
  if (manifest.privacy?.piiAllowed !== false) fail(`${entry.id}: piiAllowed는 false여야 합니다.`);
  if (manifest.privacy?.syntheticDataOnly !== true) {
    fail(`${entry.id}: syntheticDataOnly는 true여야 합니다.`);
  }
  if (manifest.privacy?.studentIdentifier !== "team-code-only") {
    fail(`${entry.id}: 학생 식별자는 team-code-only여야 합니다.`);
  }
  if (manifest.delivery?.status === "unconfirmed") {
    if (
      manifest.delivery.durationMinutes !== null ||
      manifest.delivery.teamSize !== null ||
      manifest.delivery.deviceMode !== "unconfirmed" ||
      !Array.isArray(manifest.delivery.gradeBands) ||
      manifest.delivery.gradeBands.length !== 0
    ) {
      fail(`${entry.id}: 미확정 운영정보에 임의 값을 넣을 수 없습니다.`);
    }
  } else if (manifest.delivery?.status === "confirmed") {
    if (
      !Number.isInteger(manifest.delivery.durationMinutes) ||
      !Number.isInteger(manifest.delivery.teamSize) ||
      !["individual", "team", "mixed"].includes(manifest.delivery.deviceMode) ||
      !Array.isArray(manifest.delivery.gradeBands) ||
      manifest.delivery.gradeBands.length === 0
    ) {
      fail(`${entry.id}: 확정 운영정보가 완전하지 않습니다.`);
    }
  } else {
    fail(`${entry.id}: delivery status는 unconfirmed 또는 confirmed여야 합니다.`);
  }
  if (manifest.delivery?.offlineCore !== true) {
    fail(`${entry.id}: foundation 단계에서는 offlineCore가 true여야 합니다.`);
  }
  if (manifest.integration?.mode !== "standalone") {
    fail(`${entry.id}: 검토 전 integration mode는 standalone이어야 합니다.`);
  }
  if (manifest.integration?.gomCleanEnabled !== false) {
    fail(`${entry.id}: 검토 전 gom-clean 연동을 켤 수 없습니다.`);
  }
  if (manifest.integration?.resultSchemaVersion !== expectedResultSchemaVersion) {
    fail(`${entry.id}: 결과카드 스키마 버전이 ${expectedResultSchemaVersion}과 일치해야 합니다.`);
  }
}

for (const schema of ["program-manifest.schema.json", "result-card.schema.json"]) {
  try {
    JSON.parse(await readFile(new URL(`schemas/${schema}`, root), "utf8"));
  } catch (error) {
    fail(`${schema}: 유효한 JSON이 아닙니다. ${error.message}`);
  }
}

for (const requiredDoc of [
  "docs/result-card-contract.md",
  "docs/instructor-quick-start.md",
  "docs/recovery-card.md"
]) {
  try {
    await access(new URL(requiredDoc, root));
  } catch {
    fail(`${requiredDoc}: 필수 운영 문서가 없습니다.`);
  }
}

try {
  const gomCleanStub = await readFile(new URL("src/adapters/gom-clean.stub.js", root), "utf8");
  if (!/\benabled:\s*false\b/.test(gomCleanStub)) {
    fail("gom-clean adapter는 enabled: false 상태여야 합니다.");
  }
  if (/\bfetch\s*\(/.test(gomCleanStub)) {
    fail("검토 전 gom-clean adapter에서 네트워크 요청을 만들 수 없습니다.");
  }
} catch (error) {
  fail(`gom-clean adapter를 확인할 수 없습니다. ${error.message}`);
}

const excludedDirectories = new Set([".git", "node_modules", "dist", "coverage"]);
const textExtensions = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".html",
  ".css",
  ".yml",
  ".yaml",
  ".toml",
  ".xml"
]);
const secretPatterns = [
  { name: "OpenAI key", regex: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { name: "GitHub token", regex: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g },
  {
    name: "JWT-like value",
    regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g
  },
  { name: "private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  {
    name: "server secret assignment",
    regex: /(?:SERVICE_ROLE_KEY|OPENAI_API_KEY|PROXY_TOKEN|HMAC_SECRET)\s*=\s*[^\s<>{}\[\]]{12,}/g
  }
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
    const isEnvironmentTemplate = entry.name.startsWith(".env");
    if (!textExtensions.has(extension) && entry.name !== "LICENSE" && !isEnvironmentTemplate) continue;
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
console.log(`- result card schema ${expectedResultSchemaVersion}`);
console.log("- privacy defaults and team-code-only identifier locked");
console.log("- instructor quick start and recovery docs present");
console.log("- gom-clean integration disabled");
console.log("- no secret-like values detected");
