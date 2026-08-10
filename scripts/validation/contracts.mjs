import { access } from "node:fs/promises";

export const allowed = {
  kind: new Set(["school-program", "workshop"]),
  programStatus: new Set(["draft", "pilot", "stable", "retired"]),
  deliveryStatus: new Set(["unconfirmed", "partial", "confirmed"]),
  deviceMode: new Set(["unconfirmed", "individual", "team", "mixed"]),
  gradeBand: new Set(["elementary", "middle", "high", "teacher"]),
  resourceStatus: new Set(["not-started", "pending-review", "published"])
};

export const requiredKeys = [
  "schemaVersion", "id", "version", "title", "publisher", "kind",
  "summary", "status", "delivery", "resources", "privacy", "integration"
];

export function isSemver(value) {
  if (typeof value !== "string") return false;
  const parts = value.split(".");
  return parts.length === 3 && parts.every(
    (part) => part !== "" && Number.isInteger(Number(part)) && Number(part) >= 0
  );
}

export function validateDelivery(id, delivery, fail) {
  if (!delivery || typeof delivery !== "object" || Array.isArray(delivery)) {
    fail(`${id}: delivery가 객체가 아닙니다.`);
    return;
  }
  if (!allowed.deliveryStatus.has(delivery.status)) {
    fail(`${id}: delivery status가 허용 범위를 벗어났습니다.`);
    return;
  }

  const durationKnown = Number.isInteger(delivery.durationMinutes);
  const teamKnown = Number.isInteger(delivery.teamSize);
  const grades = Array.isArray(delivery.gradeBands) ? delivery.gradeBands : [];
  const deviceKnown = delivery.deviceMode !== "unconfirmed";

  if (
    delivery.durationMinutes !== null &&
    (!durationKnown || delivery.durationMinutes < 40 || delivery.durationMinutes > 600)
  ) fail(`${id}: durationMinutes는 40~600 정수 또는 null이어야 합니다.`);

  if (
    delivery.teamSize !== null &&
    (!teamKnown || delivery.teamSize < 1 || delivery.teamSize > 6)
  ) fail(`${id}: teamSize는 1~6 정수 또는 null이어야 합니다.`);

  if (!allowed.deviceMode.has(delivery.deviceMode)) fail(`${id}: deviceMode가 올바르지 않습니다.`);
  if (!Array.isArray(delivery.gradeBands)) fail(`${id}: gradeBands는 배열이어야 합니다.`);
  if (new Set(grades).size !== grades.length) fail(`${id}: gradeBands에 중복 값이 있습니다.`);
  for (const grade of grades) {
    if (!allowed.gradeBand.has(grade)) fail(`${id}: 허용되지 않은 gradeBand입니다. ${grade}`);
  }

  const knownCount = [durationKnown, teamKnown, deviceKnown, grades.length > 0]
    .filter(Boolean).length;
  if (delivery.status === "unconfirmed" && knownCount !== 0) {
    fail(`${id}: unconfirmed 운영정보에 값을 넣을 수 없습니다.`);
  }
  if (delivery.status === "partial" && knownCount === 0) {
    fail(`${id}: partial 운영정보에는 확인된 값이 필요합니다.`);
  }
  if (
    delivery.status === "confirmed" &&
    !(durationKnown && teamKnown && deviceKnown && grades.length)
  ) fail(`${id}: confirmed 운영정보가 완전하지 않습니다.`);

  if (delivery.offlineCore !== true) fail(`${id}: offlineCore는 true여야 합니다.`);
}

export async function validateResources(id, resources, root, fail) {
  if (!resources || typeof resources !== "object" || Array.isArray(resources)) {
    fail(`${id}: resources가 객체가 아닙니다.`);
    return;
  }
  if (!allowed.resourceStatus.has(resources.status)) {
    fail(`${id}: resources status가 허용 범위를 벗어났습니다.`);
    return;
  }

  let linked = 0;
  for (const key of ["studentTool", "instructorGuide", "lessonMaterial"]) {
    const value = resources[key];
    if (value === null) continue;
    const unsafe =
      typeof value !== "string" || !value.startsWith("./") ||
      value.includes("../") || value.includes("://") ||
      value.includes(String.fromCharCode(92));
    if (unsafe) {
      fail(`${id}: ${key}는 안전한 ./ 상대경로 또는 null이어야 합니다.`);
      continue;
    }
    linked += 1;
    try {
      await access(new URL(value, new URL(`programs/${id}/`, root)));
    } catch {
      fail(`${id}: ${key} 파일을 찾을 수 없습니다. ${value}`);
    }
  }

  if (resources.status !== "published" && linked) {
    fail(`${id}: 승인 전에는 resource 경로를 연결할 수 없습니다.`);
  }
  if (resources.status === "published" && !linked) {
    fail(`${id}: published 상태에는 공개 파일이 필요합니다.`);
  }
}
