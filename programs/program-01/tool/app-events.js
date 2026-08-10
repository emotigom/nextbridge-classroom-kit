(function (root) {
  "use strict";
  const App = root.NextbridgeFairnessApp;
  const core = root.NextbridgeFairnessCore;
  if (!App || !core) {
    document.body.textContent = "실습 도구 구성 파일을 불러오지 못했습니다.";
    return;
  }

  App.prototype.applyPreset = function (id) {
    this.state.preset = id;
    this.state.config = this.presetConfig(id);
    this.state.records = this.core.clone(this.core.syntheticCases);
    this.state.selectedId = "S01";
    this.invalidateTests();
    this.setMessage(`${this.core.presets[id].name} 기준을 불러왔습니다.`, "success");
    this.render();
  };

  App.prototype.runTest = function (type) {
    const result = this.core.quickTests(this.state.config)[type];
    this.state.tests[type] = { result, completedAt: new Date().toISOString() };
    this.renderTests();
    this.saveState();
    const name = type === "normal" ? "정상" : type === "boundary" ? "경계" : "빈칸";
    this.setMessage(`${name} 테스트 결과를 기록했습니다.`, "success");
  };

  App.prototype.bindEvents = function () {
    this.el.caseSelect.addEventListener("change", () => {
      this.state.selectedId = this.el.caseSelect.value;
      this.renderCaseEditor();
      this.renderTable();
      this.saveState();
    });
    this.el.threshold.addEventListener("input", () => {
      this.state.config.threshold = Math.max(0, Math.min(100, Number(this.el.threshold.value) || 0));
      this.markCustom();
      this.render();
    });
    this.el.reviewBand.addEventListener("input", () => {
      this.state.config.reviewBand = Math.max(0, Math.min(20, Number(this.el.reviewBand.value) || 0));
      this.markCustom();
      this.render();
    });
    this.el.reviewMissing.addEventListener("change", () => {
      this.state.config.reviewMissing = this.el.reviewMissing.checked;
      this.markCustom();
      this.render();
    });
    this.el.teamCode.addEventListener("input", () => {
      this.state.teamCode = this.el.teamCode.value.toUpperCase();
      this.el.teamCode.value = this.state.teamCode;
      this.saveState();
    });
    this.el.nextStep.addEventListener("input", () => {
      this.state.nextStep = this.el.nextStep.value.slice(0, 300);
      this.saveState();
    });
    this.el.privacyCheck.addEventListener("change", () => {
      this.state.privacyChecked = this.el.privacyCheck.checked;
      this.saveState();
    });

    this.$("#reset-preset").addEventListener("click", () => this.applyPreset(this.state.preset === "custom" ? "v0" : this.state.preset));
    this.$("#reset-case").addEventListener("click", () => {
      const original = this.core.syntheticCases.find((record) => record.id === this.state.selectedId);
      const index = this.state.records.findIndex((record) => record.id === this.state.selectedId);
      this.state.records[index] = this.core.clone(original);
      this.invalidateTests();
      this.setMessage(`${this.state.selectedId} 사례를 원래 합성값으로 되돌렸습니다.`, "success");
      this.render();
    });
    this.$("#reset-all").addEventListener("click", () => {
      if (!confirm("팀코드, 기준, 사례 수정, 테스트와 다음 개선 기록을 모두 지울까요?")) return;
      try { localStorage.removeItem(this.storageKey); } catch {}
      this.state = this.initialState();
      this.setMessage("모든 기록을 처음 상태로 되돌렸습니다.", "success");
      this.render();
    });

    for (const button of this.$$('[data-test]')) {
      button.addEventListener("click", () => this.runTest(button.dataset.test));
    }

    this.$("#download-card").addEventListener("click", () => {
      try {
        const card = this.resultCard();
        this.downloadJson(card, `program-01-${card.teamCode}-result.json`);
        this.saveState();
        this.setMessage("공통 결과카드 1.1 JSON을 내려받았습니다.", "success");
      } catch (error) {
        this.setMessage(error.message, "error");
      }
    });

    this.$("#download-session").addEventListener("click", () => {
      try {
        const card = this.resultCard();
        this.downloadJson({
          schemaVersion: "1.0", tool: "nextbridge-ai-fairness-auditor",
          programId: "program-01", programVersion: this.programVersion,
          exportedAt: new Date().toISOString(), teamCode: card.teamCode,
          rule: this.currentName(), config: this.core.clone(this.state.config),
          syntheticCases: this.core.clone(this.state.records), tests: this.core.clone(this.state.tests),
          nextStep: card.nextStep, privacyChecked: true,
          disclosure: "가중합 규칙 시뮬레이터이며 실제 AI 모델이나 외부 API를 사용하지 않음"
        }, `program-01-${card.teamCode}-session.json`);
        this.saveState();
        this.setMessage("전체 실험 기록 JSON을 내려받았습니다.", "success");
      } catch (error) {
        this.setMessage(error.message, "error");
      }
    });
  };

  const app = new App(core);
  app.buildControls();
  app.bindEvents();
  app.render();
})(globalThis);
