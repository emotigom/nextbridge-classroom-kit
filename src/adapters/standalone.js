import { assertResultCard } from "../result-card.js";

const STORAGE_PREFIX = "nextbridge:classroom-kit:result:";
const PROGRAM_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TEAM_CODE_PATTERN = /^[A-Z0-9-]{2,20}$/;

function assertProgramId(programId) {
  if (!PROGRAM_ID_PATTERN.test(programId)) {
    throw new Error("프로그램 ID 형식이 올바르지 않습니다.");
  }
}

function assertTeamCode(teamCode) {
  if (!TEAM_CODE_PATTERN.test(teamCode)) {
    throw new Error("팀코드는 영문 대문자, 숫자, 하이픈으로 2~20자만 사용할 수 있습니다.");
  }
}

function storageKey(programId, teamCode) {
  assertProgramId(programId);
  assertTeamCode(teamCode);
  return `${STORAGE_PREFIX}${programId}:${teamCode}`;
}

export function createStandaloneAdapter(storage) {
  let selectedStorage = storage;
  if (!selectedStorage) {
    try {
      selectedStorage = globalThis.localStorage;
    } catch {
      throw new Error("이 브라우저에서는 로컬 저장소를 사용할 수 없습니다.");
    }
  }
  if (!selectedStorage) {
    throw new Error("이 브라우저에서는 로컬 저장소를 사용할 수 없습니다.");
  }

  return {
    mode: "standalone",

    save(resultCard) {
      assertResultCard(resultCard);
      const key = storageKey(resultCard.programId, resultCard.teamCode);
      selectedStorage.setItem(key, JSON.stringify(resultCard));
      return { stored: true, key };
    },

    load(programId, teamCode) {
      const raw = selectedStorage.getItem(storageKey(programId, teamCode));
      if (!raw) return null;

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error("저장된 결과카드가 손상되어 읽을 수 없습니다.");
      }
      return assertResultCard(parsed);
    },

    remove(programId, teamCode) {
      selectedStorage.removeItem(storageKey(programId, teamCode));
    }
  };
}

export function downloadResultCard(resultCard, documentRef = globalThis.document) {
  assertResultCard(resultCard);
  const blob = new Blob([JSON.stringify(resultCard, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = url;
  anchor.download = `${resultCard.programId}-${resultCard.teamCode}-result.json`;
  anchor.hidden = true;
  documentRef.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
