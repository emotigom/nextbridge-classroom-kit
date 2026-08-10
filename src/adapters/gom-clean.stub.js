const NOT_CONFIGURED = "GOM_CLEAN_NOT_CONFIGURED";

/**
 * Network integration is intentionally disabled in the public foundation.
 * Implement only after the private service publishes and reviews a stable
 * HTTPS contract. Never place a server credential in this module.
 */
export function createGomCleanAdapter() {
  return {
    mode: "optional-gom-clean",
    enabled: false,

    async exchangeJoinCode() {
      throw Object.assign(new Error("gom-clean 연동이 아직 구성되지 않았습니다."), {
        code: NOT_CONFIGURED
      });
    },

    async submitResult() {
      throw Object.assign(new Error("독립 실행 모드에서 JSON으로 내보내 주세요."), {
        code: NOT_CONFIGURED
      });
    }
  };
}

