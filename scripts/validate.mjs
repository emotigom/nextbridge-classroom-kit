import { readFile } from "node:fs/promises";
import process from "node:process";
import {
  allowed,
  isSemver,
  requiredKeys,
  validateDelivery,
  validateResources
} from "./validation/contracts.mjs";
import { validateSecurity } from "./validation/security.mjs";

const root = new URL("../", import.meta.url);
const errors = [];
const fail = (message) => errors.push(message);
const readJson = async (path) => JSON.parse(await readFile(new URL(path, root), "utf8"));

let brand;
let catalog;
let programSchema;
let resultSchema;
try {
  [brand, catalog, programSchema, resultSchema] = await Promise.all([
    readJson("config/brand.json"),
    readJson("programs/catalog.json"),
    readJson("schemas/program-manifest.schema.json"),
    readJson("schemas/result-card.schema.json")
  ]);
} catch (error) {
  fail(`브랜드, 프로그램 목록 또는 스키마를 읽을 수 없습니다. ${error.message}`);
}

if (brand?.name !== "Nextbridge") fail("brand name은 Nextbridge여야 합니다.");
if (catalog?.publisher !== brand?.name) fail("catalog publisher와 brand name이 다릅니다.");
if (programSchema?.properties?.schemaVersion?.const !== "1.1") {
  fail("program manifest schemaVersion은 1.1이어야 합니다.");
}
if (resultSchema?.properties?.schemaVersion?.const !== "1.1") {
  fail("result card schemaVersion은 1.1이어야 합니다.");
}

const entries = catalog?.programs ?? [];
const ids = entries.map(({ id }) => id);
if (ids.length !== 3 || new Set(ids).size !== 3) {
  fail("catalog에는 서로 다른 프로그램 세 개가 있어야 합니다.");
}

for (const entry of entries) {
  if (entry.manifest !== `./${entry.id}/manifest.json`) {
    fail(`${entry.id}: catalog manifest 경로가 올바르지 않습니다.`);
  }

  let manifest;
  try {
    manifest = await readJson(`programs/${entry.id}/manifest.json`);
  } catch (error) {
    fail(`${entry.id}: manifest를 읽을 수 없습니다. ${error.message}`);
    continue;
  }

  for (const key of requiredKeys) {
    if (!(key in manifest)) fail(`${entry.id}: ${key} 필드가 없습니다.`);
  }
  if (manifest.schemaVersion !== "1.1") fail(`${entry.id}: schemaVersion은 1.1이어야 합니다.`);
  if (manifest.id !== entry.id) fail(`${entry.id}: 폴더명과 manifest id가 다릅니다.`);
  if (!isSemver(manifest.version)) fail(`${entry.id}: version은 x.y.z 형식이어야 합니다.`);
  if (manifest.publisher !== "Nextbridge") fail(`${entry.id}: publisher는 Nextbridge여야 합니다.`);
  if (!allowed.kind.has(manifest.kind)) fail(`${entry.id}: kind가 올바르지 않습니다.`);
  if (!allowed.programStatus.has(manifest.status)) fail(`${entry.id}: status가 올바르지 않습니다.`);
  if (!manifest.summary?.trim()) fail(`${entry.id}: summary가 비어 있습니다.`);
  if (
    (manifest.title || "").includes("이름 확정 예정") ||
    (manifest.title || "").startsWith("Nextbridge Program 0")
  ) fail(`${entry.id}: 임시 제목이 남아 있습니다.`);

  validateDelivery(entry.id, manifest.delivery, fail);
  await validateResources(entry.id, manifest.resources, root, fail);

  if (manifest.privacy?.piiAllowed !== false) fail(`${entry.id}: piiAllowed는 false여야 합니다.`);
  if (manifest.privacy?.syntheticDataOnly !== true) {
    fail(`${entry.id}: syntheticDataOnly는 true여야 합니다.`);
  }
  if (manifest.privacy?.studentIdentifier !== "team-code-only") {
    fail(`${entry.id}: 학생 식별자는 team-code-only여야 합니다.`);
  }
  if (manifest.integration?.mode !== "standalone") {
    fail(`${entry.id}: integration mode는 standalone이어야 합니다.`);
  }
  if (manifest.integration?.gomCleanEnabled !== false) {
    fail(`${entry.id}: gom-clean 연동을 켤 수 없습니다.`);
  }
  if (manifest.integration?.resultSchemaVersion !== "1.1") {
    fail(`${entry.id}: 결과카드 스키마 버전이 다릅니다.`);
  }
}

await validateSecurity(root, fail);

if (errors.length) {
  console.error("\nValidation failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Validation passed.");
console.log(`- publisher: ${brand.name}`);
console.log(`- ${ids.length} verified program names`);
console.log("- program manifest schema 1.1");
console.log("- result card schema 1.1");
console.log("- partial/unconfirmed delivery and public resource states validated");
console.log("- privacy defaults and team-code-only identifier locked");
console.log("- gom-clean integration disabled");
console.log("- no secret-like values detected");
