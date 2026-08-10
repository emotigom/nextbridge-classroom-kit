(function (root) {
  "use strict";
  const App = root.NextbridgeFairnessApp;
  if (!App) throw new Error("app-state.js를 먼저 불러와 주세요.");

  App.prototype.renderTable = function () {
    this.el.resultBody.replaceChildren();
    for (const result of this.currentResults()) {
      const row = document.createElement("tr");
      row.dataset.id = result.id;
      row.tabIndex = 0;
      if (result.id === this.state.selectedId) row.classList.add("selected");
      const values = this.fieldKeys.map((key) => `<td>${result[key] === "" || result[key] === null ? "빈칸" : result[key]}</td>`).join("");
      row.innerHTML = `<td>${result.id}</td>${values}<td>${result.score.toFixed(2)}</td><td>${this.decisionLabel(result.decision)}</td><td><span class="badge ${result.handling}">${this.handlingLabel(result.handling)}</span></td>`;
      const selectRow = () => {
        this.state.selectedId = result.id;
        this.renderCaseEditor();
        this.renderTable();
        this.saveState();
      };
      row.addEventListener("click", selectRow);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectRow();
        }
      });
      this.el.resultBody.append(row);
    }
  };

  App.prototype.renderStats = function () {
    const results = this.currentResults();
    const changed = this.changedIds();
    this.el.priorityCount.textContent = `${results.filter((item) => item.decision === "priority").length}건`;
    this.el.reviewCount.textContent = `${results.filter((item) => item.handling === "review").length}건`;
    this.el.changedCount.textContent = `${changed.length}건`;
    this.el.currentRule.textContent = this.state.preset === "custom" ? "직접 수정" : this.state.preset;
    this.el.comparisonSummary.textContent = changed.length
      ? `v0와 비교해 ${changed.join(" · ")}의 결정 또는 처리 방식이 달라졌습니다.`
      : "v0와 비교해 결정이나 처리 방식이 달라진 사례가 없습니다.";
  };

  App.prototype.renderTests = function () {
    for (const type of ["normal", "boundary", "missing"]) {
      this.$(`#test-${type}`).textContent = this.state.tests[type]?.result
        ? this.formatTest(this.state.tests[type].result)
        : "아직 실행하지 않았습니다.";
    }
  };

  App.prototype.renderEvidence = function () {
    this.el.evidenceSummary.textContent = this.evidenceSummaryText();
    this.el.teamCode.value = this.state.teamCode;
    this.el.nextStep.value = this.state.nextStep;
    this.el.privacyCheck.checked = this.state.privacyChecked;
  };

  App.prototype.render = function () {
    this.syncConfigInputs();
    const sum = this.fieldKeys.reduce((total, key) => total + Number(this.state.config.weights[key] || 0), 0);
    this.el.weightSum.textContent = sum === 100
      ? "가중치 합계 100 · 기준끼리 비교할 수 있습니다."
      : `가중치 합계 ${sum} · 결과카드를 만들기 전에 100으로 맞춰주세요.`;
    this.el.weightSum.classList.toggle("bad", sum !== 100);
    this.renderCaseEditor();
    this.renderTable();
    this.renderStats();
    this.renderTests();
    this.renderEvidence();
    this.saveState();
  };
})(globalThis);
