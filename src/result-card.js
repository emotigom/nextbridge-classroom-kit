const PROGRAM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const TEAM_CODE_PATTERN = /^[A-Z0-9-]{2,20}$/;
const DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const AI_STATUSES = new Set(["not-used", "used", "not-applicable"]);
const RESULT_CARD_KEYS = new Set([
  "schemaVersion",
  "programId",
  "programVersion",
  "teamCode",
  "completedAt",
  "summary",
  "evidence",
  "nextStep",
  "aiDisclosure",
  "privacyChecked"
]);
const EVIDENCE_KEYS = new Set(["label", "value"]);
const AI_DISCLOSURE_KEYS = new Set(["status", "note"]);

const PROHIBITED_PATTERNS = [
  {
    code: "EMAIL",
    message: "이메일 주소로 보이는 값이 있습니다.",
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  },
  {
    code: "KOREAN_PHONE",
    message: "전화번호로 보이는 값이 있습니다.",
    regex: /(?:^|[^\d])(?:01[016789]|02|0[3-6][1-5]|070)[-\s.]?\d{3,4}[-\s.]?\d{4}(?:[^\d]|$)/
  },
  {
    code: "RESIDENT_ID",
    message: "주민등록번호로 보이는 값이 있습니다.",
    regex: /(?:^|[^\d])\d{6}[-\s]?[1-8]\d{6}(?:[^\d]|$)/
  },
  {
    code: "OPENAI_KEY",
    message: "API 키로 보이는 값이 있습니다.",
    regex: /\bsk-[A-Za-z0-9_-]{20,}\b/
  },
  {
    code: "GITHUB_TOKEN",
    message: "GitHub 토큰으로 보이는 값이 있습니다.",
    regex: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/
  },
  {
    code: "JWT",
    message: "인증 토큰으로 보이는 값이 있습니다.",
    regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/
  },
  {
    code: "PRIVATE_KEY",
    message: "비밀키로 보이는 값이 있습니다.",
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/
  }
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unknownKeys(record, allowedKeys) {
  return Object.keys(record).filter((key) => !allowedKeys.has(key));
}

function validateText(errors, field, value, { min = 1, max }) {
  if (typeof value !== "string") {
    errors.push(`${field}은(는) 문자열이어야 합니다.`);
    return;
  }
  const length = value.trim().length;
  if (length < min) errors.push(`${field}을(를) 입력해 주세요.`);
  if (length > max) errors.push(`${field}은(는) ${max}자 이하여야 합니다.`);
}

function textEntries(resultCard) {
  const entries = [
    ["teamCode", resultCard.teamCode],
    ["summary", resultCard.summary],
    ["nextStep", resultCard.nextStep],
    ["aiDisclosure.note", resultCard.aiDisclosure?.note]
  ];

  if (Array.isArray(resultCard.evidence)) {
    for (const [index, item] of resultCard.evidence.entries()) {
      entries.push([`evidence[${index}].label`, item?.label]);
      entries.push([`evidence[${index}].value`, item?.value]);
    }
  }

  return entries.filter(([, value]) => typeof value === "string");
}

export function findProhibitedData(resultCard) {
  const findings = [];

  for (const [field, value] of textEntries(resultCard)) {
    for (const pattern of PROHIBITED_PATTERNS) {
      if (pattern.regex.test(value)) {
        findings.push({
          field,
          code: pattern.code,
          message: pattern.message
        });
      }
    }
  }

  return findings;
}

export function validateResultCard(resultCard) {
  const errors = [];

  if (!isRecord(resultCard)) return ["결과카드가 올바른 객체 형식이 아닙니다."];

  for (const key of unknownKeys(resultCard, RESULT_CARD_KEYS)) {
    errors.push(`허용되지 않은 결과카드 필드가 있습니다: ${key}`);
  }

  if (resultCard.schemaVersion !== "1.1") {
    errors.push("결과카드 schemaVersion은 1.1이어야 합니다.");
  }
  if (typeof resultCard.programId !== "string" || !PROGRAM_ID_PATTERN.test(resultCard.programId)) {
    errors.push("programId 형식이 올바르지 않습니다.");
  }
  if (
    typeof resultCard.programVersion !== "string" ||
    !SEMVER_PATTERN.test(resultCard.programVersion)
  ) {
    errors.push("programVersion은 x.y.z 형식이어야 합니다.");
  }
  if (typeof resultCard.teamCode !== "string" || !TEAM_CODE_PATTERN.test(resultCard.teamCode)) {
    errors.push("팀코드는 영문 대문자, 숫자, 하이픈으로 2~20자만 사용할 수 있습니다.");
  }
  if (
    typeof resultCard.completedAt !== "string" ||
    !DATE_TIME_PATTERN.test(resultCard.completedAt) ||
    Number.isNaN(Date.parse(resultCard.completedAt))
  ) {
    errors.push("completedAt은 유효한 날짜와 시간이어야 합니다.");
  }

  validateText(errors, "핵심 결과", resultCard.summary, { max: 300 });

  if (!Array.isArray(resultCard.evidence)) {
    errors.push("검증 근거는 배열이어야 합니다.");
  } else {
    if (resultCard.evidence.length < 1 || resultCard.evidence.length > 8) {
      errors.push("검증 근거는 1~8개여야 합니다.");
    }
    for (const [index, item] of resultCard.evidence.entries()) {
      if (!isRecord(item)) {
        errors.push(`검증 근거 ${index + 1}의 형식이 올바르지 않습니다.`);
        continue;
      }
      for (const key of unknownKeys(item, EVIDENCE_KEYS)) {
        errors.push(`검증 근거 ${index + 1}에 허용되지 않은 필드가 있습니다: ${key}`);
      }
      validateText(errors, `검증 근거 ${index + 1}의 이름`, item.label, { max: 60 });
      validateText(errors, `검증 근거 ${index + 1}의 내용`, item.value, { max: 500 });
    }
  }

  validateText(errors, "다음 개선", resultCard.nextStep, { max: 300 });

  if (!isRecord(resultCard.aiDisclosure)) {
    errors.push("AI 사용 공개 형식이 올바르지 않습니다.");
  } else {
    for (const key of unknownKeys(resultCard.aiDisclosure, AI_DISCLOSURE_KEYS)) {
      errors.push(`AI 사용 공개에 허용되지 않은 필드가 있습니다: ${key}`);
    }
    if (!AI_STATUSES.has(resultCard.aiDisclosure.status)) {
      errors.push("AI 사용 여부를 올바르게 선택해 주세요.");
    }
    validateText(errors, "AI 사용 설명", resultCard.aiDisclosure.note, {
      min: resultCard.aiDisclosure.status === "used" ? 1 : 0,
      max: 300
    });
  }

  if (resultCard.privacyChecked !== true) {
    errors.push("개인정보 확인이 완료되지 않았습니다.");
  }

  for (const finding of findProhibitedData(resultCard)) {
    errors.push(`${finding.field}: ${finding.message}`);
  }

  return [...new Set(errors)];
}

export function assertResultCard(resultCard) {
  const errors = validateResultCard(resultCard);
  if (errors.length === 0) return resultCard;

  const error = new Error(errors[0]);
  error.code = "INVALID_RESULT_CARD";
  error.details = errors;
  throw error;
}
