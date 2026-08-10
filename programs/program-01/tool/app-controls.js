(function (root) {
  "use strict";
  const App = root.NextbridgeFairnessApp;
  if (!App) throw new Error("app-state.js를 먼저 불러와 주세요.");

  App.prototype.buildControls = function () {
    this.el.presetButtons.replaceChildren();
    for (const preset of Object.values(this.core.presets)) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "preset";
      button.dataset.preset = preset.id;
      button.innerHTML = `<strong>${preset.name}</strong><span>${preset.description}</span>`;
      button.addEventListener("click", () => this.applyPreset(preset.id));
      this.el.presetButtons.append(button);
    }

    this.el.weightInputs.replaceChildren();
    for (const key of this.fieldKeys) {
      const label = document.createElement("label");
      label.className = "field";
      label.innerHTML = `<span>${key} · ${this.core.fields[key].label}<small>${this.core.fields[key].help}</small></span>`;
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "100";
      input.step = "5";
      input.id = `weight-${key}`;
      input.addEventListener("input", () => {
        this.state.config.weights[key] = Math.max(0, Math.min(100, Number(input.value) || 0));
        this.markCustom();
        this.render();
      });
      label.append(input);
      this.el.weightInputs.append(label);
    }

    this.el.caseSelect.replaceChildren();
    for (const record of this.core.syntheticCases) {
      const option = document.createElement("option");
      option.value = record.id;
      option.textContent = `${record.id} 합성 사례`;
      this.el.caseSelect.append(option);
    }
  };

  App.prototype.renderCaseEditor = function () {
    const record = this.state.records.find((item) => item.id === this.state.selectedId);
    this.el.caseSelect.value = this.state.selectedId;
    this.el.caseInputs.replaceChildren();
    if (!record) return;
    for (const key of this.fieldKeys) {
      const label = document.createElement("label");
      label.className = "field";
      const title = document.createElement("span");
      title.textContent = `${key} · ${this.core.fields[key].label}`;
      const select = document.createElement("select");
      select.innerHTML = '<option value="">빈칸</option>' + [0, 1, 2, 3, 4]
        .map((value) => `<option value="${value}">${value}단계</option>`).join("");
      select.value = record[key] === "" || record[key] === null ? "" : String(record[key]);
      select.addEventListener("change", () => {
        record[key] = select.value === "" ? "" : Number(select.value);
        this.invalidateTests();
        this.render();
      });
      label.append(title, select);
      this.el.caseInputs.append(label);
    }
  };

  App.prototype.syncConfigInputs = function () {
    for (const key of this.fieldKeys) this.$(`#weight-${key}`).value = String(this.state.config.weights[key]);
    this.el.threshold.value = String(this.state.config.threshold);
    this.el.reviewBand.value = String(this.state.config.reviewBand);
    this.el.reviewMissing.checked = this.state.config.reviewMissing;
    for (const button of this.$$(".preset")) {
      button.setAttribute("aria-pressed", String(button.dataset.preset === this.state.preset));
    }
  };
})(globalThis);
