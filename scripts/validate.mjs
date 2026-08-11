import { access, readFile, readdir } from "node:fs/promises";
import { extname, relative } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const errors = [];
const fail = (message) => errors.push(message);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

const requiredPaths = [
  "README.md",
  "LICENSE",
  "SECURITY.md",
  "index.html",
  "archive/README.md",
  "docs/security-boundary.md",
  "config/brand.json",
  "programs/catalog.json",
  "programs/program-01/manifest.json",
  "programs/program-02/manifest.json",
  "programs/program-03/manifest.json",
  "programs/program-03/guide/index.html",
  "programs/program-03/guide/styles.css",
  "programs/program-03/guide/guide.js",
  "go/workshop/index.html",
  ".github/workflows/pages.yml"
];

for (const path of requiredPaths) {
  try {
    await access(new URL(path, root));
  } catch {
    fail(`${path}: 필요한 파일이 없습니다.`);
  }
}

let brand;
let catalog;
try {
  brand = await readJson("config/brand.json");
  catalog = await readJson("programs/catalog.json");
} catch (error) {
  fail(`브랜드 또는 프로그램 목록을 읽을 수 없습니다. ${error.message}`);
}

if (brand?.name !== "Nextbridge") fail("브랜드 이름은 Nextbridge여야 합니다.");
if (catalog?.publisher !== "Nextbridge") fail("프로그램 발행 주체는 Nextbridge여야 합니다.");

const expectedPrograms = [
  ["program-01", "학교 AI 수업"],
  ["program-02", "전환기 AI·SW 수업"],
  ["program-03", "교육 도구 워크숍"]
];
const entries = catalog?.programs ?? [];

if (entries.length !== expectedPrograms.length) {
  fail("프로그램 자리는 세 개여야 합니다.");
}

for (const [id, title] of expectedPrograms) {
  const entry = entries.find((item) => item.id === id);
  if (!entry) {
    fail(`${id}: catalog에 프로그램이 없습니다.`);
    continue;
  }
  const expectedPath = `./${id}/manifest.json`;
  if (entry.manifest !== expectedPath) fail(`${id}: manifest 경로가 올바르지 않습니다.`);

  let manifest;
  try {
    manifest = await readJson(`programs/${id}/manifest.json`);
  } catch (error) {
    fail(`${id}: manifest를 읽을 수 없습니다. ${error.message}`);
    continue;
  }

  if (manifest.id !== id) fail(`${id}: manifest id가 다릅니다.`);
  if (manifest.title !== title) fail(`${id}: 공개용 이름이 다릅니다.`);
  if (manifest.publisher !== "Nextbridge") fail(`${id}: publisher가 다릅니다.`);
  if (manifest.status !== "planning") fail(`${id}: 현재 상태는 planning이어야 합니다.`);
  if (typeof manifest.summary !== "string" || !manifest.summary.trim()) {
    fail(`${id}: 간단한 설명이 필요합니다.`);
  }
  if (!Array.isArray(manifest.resources)) {
    fail(`${id}: resources는 배열이어야 합니다.`);
    continue;
  }

  for (const resource of manifest.resources) {
    if (typeof resource !== "string" || !resource.startsWith("./") || resource.includes("../") || resource.includes("://")) {
      fail(`${id}: 공개 자료는 안전한 상대경로만 사용할 수 있습니다.`);
      continue;
    }
    try {
      await access(new URL(resource, new URL(`programs/${id}/`, root)));
    } catch {
      fail(`${id}: 연결한 자료를 찾을 수 없습니다. ${resource}`);
    }
  }
}

const excludedDirectories = new Set([".git", "node_modules", "archive"]);
const textExtensions = new Set([
  ".js", ".mjs", ".cjs", ".json", ".md", ".txt", ".html", ".css", ".yml", ".yaml", ".toml", ".xml"
]);
const forbiddenDetailedNames = [
  ["2026 찾아가는", "AI교육 지원 프로그램"].join(" "),
  ["2026 중등 학교급 전환기", "찾아가는 AI·SW 프로그램"].join(" "),
  ["2026 경기 성취도평가", "표준화 평가도구 개발 합숙 워크숍"].join(" ")
];
const secretPatterns = [
  ["OpenAI key", /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ["GitHub token", /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g],
  ["JWT-like value", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/g],
  ["private key", new RegExp(["-----BEGIN ", "(?:RSA |EC |OPENSSH )?PRIVATE KEY-----"].join(""), "g")],
  ["server secret assignment", new RegExp(["(?:SERVICE_ROLE_KEY|OPENAI_API_KEY|PROXY_TOKEN|HMAC_SECRET)", "\\s*=\\s*[^\\s<>{}\\[\\]]{12,}"].join(""), "g")]
];

async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const url = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
    if (entry.isDirectory()) {
      await scan(url);
      continue;
    }
    if (!textExtensions.has(extname(entry.name)) && entry.name !== "LICENSE") continue;

    const content = await readFile(url, "utf8");
    const path = relative(rootPath, fileURLToPath(url));

    for (const detailedName of forbiddenDetailedNames) {
      if (content.includes(detailedName)) {
        fail(`${path}: 공개 영역에 구체적인 내부 사업명이 남아 있습니다.`);
      }
    }
    if (content.includes(["gomCleanEnabled", ": true"].join(""))) {
      fail(`${path}: gom-clean 연동을 활성화할 수 없습니다.`);
    }
    for (const [name, pattern] of secretPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) fail(`${path}: ${name}로 보이는 값이 있습니다.`);
    }
  }
}

await scan(root);

if (errors.length) {
  console.error("\nValidation failed:\n");
  for (const error of [...new Set(errors)]) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validation passed.");
console.log("- minimal public structure");
console.log("- 3 generic program placeholders");
console.log("- archived features kept in Git history");
console.log("- gom-clean integration inactive");
console.log("- no obvious secrets or detailed internal program names detected");
