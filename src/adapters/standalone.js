const STORAGE_PREFIX = "nextbridge:classroom-kit:result:";

function assertTeamCode(teamCode) {
  if (!/^[A-Z0-9-]{2,20}$/.test(teamCode)) {
    throw new Error("팀코드는 영문 대문자, 숫자, 하이픈으로 2~20자만 사용할 수 있습니다.");
  }
}

export function createStandaloneAdapter(storage = globalThis.localStorage) {
  return {
    mode: "standalone",

    save(resultCard) {
      assertTeamCode(resultCard.teamCode);
      const key = `${STORAGE_PREFIX}${resultCard.programId}:${resultCard.teamCode}`;
      storage.setItem(key, JSON.stringify(resultCard));
      return { stored: true, key };
    },

    load(programId, teamCode) {
      assertTeamCode(teamCode);
      const raw = storage.getItem(`${STORAGE_PREFIX}${programId}:${teamCode}`);
      return raw ? JSON.parse(raw) : null;
    },

    remove(programId, teamCode) {
      assertTeamCode(teamCode);
      storage.removeItem(`${STORAGE_PREFIX}${programId}:${teamCode}`);
    }
  };
}

export function downloadResultCard(resultCard, documentRef = globalThis.document) {
  const blob = new Blob([JSON.stringify(resultCard, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = url;
  anchor.download = `${resultCard.programId}-${resultCard.teamCode}-result.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

