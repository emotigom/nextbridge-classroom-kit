(function (root) {
  "use strict";

  class FairnessApp {
    constructor(core) {
      this.core = core;
      this.storageKey = "nextbridge:program-01:ai-fairness-auditor:v1";
      this.programVersion = "0.4.0";
      this.fieldKeys = Object.keys(core.fields);
      this.$ = (selector) => document.querySelector(selector);
      this.$$ = (selector) => [...document.querySelectorAll(selector)];
      this.el = {
        presetButtons: this.$("#preset-buttons"), weightInputs: this.$("#weight-inputs"),
        weightSum: this.$("#weight-sum"), threshold: this.$("#threshold"),
        reviewBand: this.$("#review-band"), reviewMissing: this.$("#review-missing"),
        caseSelect: this.$("#case-select"), caseInputs: this.$("#case-inputs"),
        resultBody: this.$("#result-body"), priorityCount: this.$("#priority-count"),
        reviewCount: this.$("#review-count"), changedCount: this.$("#changed-count"),
        currentRule: this.$("#current-rule"), comparisonSummary: this.$("#comparison-summary"),
        teamCode: this.$("#team-code"), nextStep: this.$("#next-step"),
        privacyCheck: this.$("#privacy-check"), evidenceSummary: this.$("#evidence-summary"),
        message: this.$("#message"), saveState: this.$("#save-state")
      };
      this.state = this.loadState();
      this.saveTimer = null;
    }

    presetConfig(id) {
      const preset = this.core.presets[id] || this.core.presets.v0;
      return {
        weights: this.core.clone(preset.weights), threshold: preset.threshold,
        reviewBand: preset.reviewBand, reviewMissing: preset.reviewMissing
      };
    }

    initialState() {
      return {
        preset: "v0", config: this.presetConfig("v0"),
        records: this.core.clone(this.core.syntheticCases), selectedId: "S01",
        tests: {}, teamCode: "", nextStep: "", privacyChecked: false
      };
    }

    normalizeRecords(value) {
      if (!Array.isArray(value)) return this.core.clone(this.core.syntheticCases);
      return this.core.syntheticCases.map((original) => {
        const saved = value.find((record) => record?.id === original.id) || original;
        const record = { id: original.id };
        for (const key of this.fieldKeys) {
          const candidate = saved[key];
          if (candidate === "" || candidate === null) record[key] = candidate;
          else {
            const number = Number(candidate);
            record[key] = Number.isFinite(number) && number >= 0 && number <= 4 ? number : original[key];
          }
        }
        return record;
      });
    }

    loadState() {
      try {
        const raw = localStorage.getItem(this.storageKey);
        if (!raw) return this.initialState();
        const saved = JSON.parse(raw);
        const state = this.initialState();
        state.preset = ["v0", "v1", "v2", "custom"].includes(saved.preset) ? saved.preset : "v0";
        state.config = this.core.normalizeConfig(saved.config);
        state.records = this.normalizeRecords(saved.records);
        state.selectedId = this.core.syntheticCases.some((record) => record.id === saved.selectedId) ? saved.selectedId : "S01";
        state.tests = saved.tests && typeof saved.tests === "object" ? saved.tests : {};
        state.teamCode = typeof saved.teamCode === "string" ? saved.teamCode.slice(0, 20) : "";
        state.nextStep = typeof saved.nextStep === "string" ? saved.nextStep.slice(0, 300) : "";
        state.privacyChecked = Boolean(saved.privacyChecked);
        this.el.saveState.textContent = "이전 브라우저 기록 복원";
        return state;
      } catch {
        return this.initialState();
      }
    }

    saveState() {
      clearTimeout(this.saveTimer);
      this.el.saveState.textContent = "브라우저에 저장 중…";
      this.saveTimer = setTimeout(() => {
        try {
          const stored = this.core.clone(this.state);
          try {
            this.core.assertSafeText([stored.nextStep]);
          } catch {
            stored.nextStep = "";
            stored.privacyChecked = false;
            this.el.saveState.textContent = "민감정보로 보이는 문장은 저장하지 않음";
          }
          localStorage.setItem(this.storageKey, JSON.stringify(stored));
          if (this.el.saveState.textContent === "브라우저에 저장 중…") {
            this.el.saveState.textContent = "브라우저에 자동 저장됨";
          }
        } catch {
          this.el.saveState.textContent = "브라우저 저장 불가 · JSON을 사용하세요";
        }
      }, 120);
    }

    setMessage(text, tone = "") {
      this.el.message.textContent = text;
      this.el.message.className = `message${tone ? ` ${tone}` : ""}`;
    }

    decisionLabel(value) { return value === "priority" ? "우선안내" : "일반안내"; }
    handlingLabel(value) {
      if (value === "review") return "사람 확인";
      return value === "priority" ? "자동안내" : "일반안내";
    }
    currentName() { return this.state.preset === "custom" ? "직접 수정" : this.core.presets[this.state.preset].name; }
    invalidateTests() { this.state.tests = {}; }
    markCustom() { this.state.preset = "custom"; this.invalidateTests(); }
    currentResults() { return this.core.calculate(this.state.records, this.state.config); }
    baselineResults() { return this.core.calculate(this.core.syntheticCases, this.presetConfig("v0")); }
    changedIds() { return this.core.compare(this.baselineResults(), this.currentResults()); }

    evidenceSummaryText() {
      const results = this.currentResults();
      const priority = results.filter((result) => result.decision === "priority").length;
      const review = results.filter((result) => result.handling === "review").length;
      return `v0와 비교해 ${this.changedIds().length}개 사례의 결정 또는 처리 방식이 달라졌고, 현재 기준은 ${priority}건을 우선안내하고 ${review}건을 사람 확인으로 보냅니다.`;
    }

    formatTest(result) {
      const missing = result.missing ? " · 빈칸 있음" : "";
      return `${result.id} · ${result.score.toFixed(2)}점 · 계산 ${this.decisionLabel(result.decision)} · 처리 ${this.handlingLabel(result.handling)}${missing}`;
    }
  }

  root.NextbridgeFairnessApp = FairnessApp;
})(globalThis);
