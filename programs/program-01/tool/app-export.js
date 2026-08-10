(function (root) {
  "use strict";
  const App = root.NextbridgeFairnessApp;
  if (!App) throw new Error("app-state.js를 먼저 불러와 주세요.");

  App.prototype.testEvidenceText = function () {
    return ["normal", "boundary", "missing"].map((type) => this.formatTest(this.state.tests[type].result)).join(" / ");
  };

  App.prototype.settingsText = function () {
    const weights = this.fieldKeys.map((key) => `${key}${this.state.config.weights[key]}`).join(" · ");
    const changed = this.changedIds();
    return `${this.currentName()} · ${weights} · 기준 ${this.state.config.threshold}점 · 사람 확인 ±${this.state.config.reviewBand}점 · v0 대비 변경 ${changed.length}건(${changed.join(", ") || "없음"})`;
  };

  App.prototype.syncEvidenceInputs = function () {
    this.state.teamCode = this.el.teamCode.value.trim().toUpperCase();
    this.el.teamCode.value = this.state.teamCode;
    this.state.nextStep = this.el.nextStep.value.trim();
    this.state.privacyChecked = this.el.privacyCheck.checked;
  };

  App.prototype.validateForDownload = function () {
    this.syncEvidenceInputs();
    if (!/^[A-Z0-9-]{2,20}$/.test(this.state.teamCode)) throw new Error("팀코드를 올바르게 입력해 주세요.");
    const sum = this.fieldKeys.reduce((total, key) => total + Number(this.state.config.weights[key] || 0), 0);
    if (sum !== 100) throw new Error("가중치 합계를 100으로 맞춰주세요.");
    if (!["normal", "boundary", "missing"].every((type) => this.state.tests[type]?.result)) {
      throw new Error("정상·경계·빈칸 테스트를 모두 실행해 주세요.");
    }
    if (!this.state.nextStep) throw new Error("다음에 바꿀 한 가지를 적어주세요.");
    if (!this.state.privacyChecked) throw new Error("개인정보와 비밀정보가 없음을 확인해 주세요.");
  };

  App.prototype.resultCard = function () {
    this.validateForDownload();
    return this.core.buildResultCard({
      programVersion: this.programVersion, teamCode: this.state.teamCode,
      summary: this.evidenceSummaryText(),
      evidence: [
        { label: "v0와 현재 기준 비교", value: this.settingsText().slice(0, 500) },
        { label: "정상·경계·빈칸 테스트", value: this.testEvidenceText().slice(0, 500) }
      ],
      nextStep: this.state.nextStep, privacyChecked: true
    });
  };

  App.prototype.downloadJson = function (value, filename) {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };
})(globalThis);
