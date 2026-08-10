import { createStandaloneAdapter, downloadResultCard } from "../src/adapters/standalone.js";

const list = document.querySelector("#program-list");
const select = document.querySelector("#program-id");
const form = document.querySelector("#result-form");
const teamCodeInput = document.querySelector("#team-code");
const summaryInput = document.querySelector("#summary");
const evidenceInput = document.querySelector("#evidence");
const nextStepInput = document.querySelector("#next-step");
const aiStatusInput = document.querySelector("#ai-status");
const aiNoteField = document.querySelector("#ai-note-field");
const aiNoteInput = document.querySelector("#ai-note");
const privacyCheck = document.querySelector("#privacy-check");
const loadButton = document.querySelector("#load");
const downloadButton = document.querySelector("#download");
const removeButton = document.querySelector("#remove");
const message = document.querySelector("#message");

let adapter = null;
let programs = [];
let latestResult = null;

function setMessage(text, tone = "info") {
  message.textContent = text;
  message.dataset.tone = tone;
}

function selectedProgram() {
  return programs.find((program) => program.id === select.value);
}

function normalizedTeamCode() {
  const teamCode = teamCodeInput.value.trim().toUpperCase();
  teamCodeInput.value = teamCode;
  return teamCode;
}

function clearLatestResult() {
  latestResult = null;
  downloadButton.disabled = true;
}

function syncAiNote() {
  const used = aiStatusInput.value === "used";
  aiNoteField.hidden = !used;
  aiNoteInput.required = used;
  if (!used) aiNoteInput.value = "";
}

function buildResultCard() {
  const program = selectedProgram();
  if (!program) throw new Error("프로그램을 먼저 선택해 주세요.");

  return {
    schemaVersion: "1.1",
    programId: program.id,
    programVersion: program.version,
    teamCode: normalizedTeamCode(),
    completedAt: new Date().toISOString(),
    summary: summaryInput.value.trim(),
    evidence: [
      {
        label: "검증 근거",
        value: evidenceInput.value.trim()
      }
    ],
    nextStep: nextStepInput.value.trim(),
    aiDisclosure: {
      status: aiStatusInput.value,
      note: aiNoteInput.value.trim()
    },
    privacyChecked: privacyCheck.checked
  };
}

function applyResultCard(resultCard) {
  if (!programs.some((program) => program.id === resultCard.programId)) {
    throw new Error("현재 프로그램 목록에 없는 저장본입니다.");
  }

  select.value = resultCard.programId;
  teamCodeInput.value = resultCard.teamCode;
  summaryInput.value = resultCard.summary;
  evidenceInput.value = resultCard.evidence[0]?.value || "";
  nextStepInput.value = resultCard.nextStep;
  aiStatusInput.value = resultCard.aiDisclosure.status;
  aiNoteInput.value = resultCard.aiDisclosure.note;
  privacyCheck.checked = resultCard.privacyChecked;
  syncAiNote();
}

async function loadPrograms() {
  const catalogResponse = await fetch("../programs/catalog.json", { cache: "no-store" });
  if (!catalogResponse.ok) throw new Error("프로그램 목록을 불러오지 못했습니다.");
  const catalog = await catalogResponse.json();
  if (catalog.publisher !== "Nextbridge") {
    throw new Error("프로그램 발행 주체를 확인할 수 없습니다.");
  }

  programs = await Promise.all(
    catalog.programs.map(async (entry) => {
      const manifestUrl = new URL(entry.manifest, new URL("../programs/catalog.json", location.href));
      const response = await fetch(manifestUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`${entry.id} 정보를 불러오지 못했습니다.`);
      const manifest = await response.json();
      if (manifest.id !== entry.id) {
        throw new Error(`${entry.id}의 목록과 manifest가 일치하지 않습니다.`);
      }
      if (manifest.integration.gomCleanEnabled !== false) {
        throw new Error(`${entry.id}의 비활성 연동 상태를 확인할 수 없습니다.`);
      }
      return manifest;
    })
  );
}

function renderPrograms() {
  list.replaceChildren();
  select.replaceChildren();

  for (const [index, program] of programs.entries()) {
    const article = document.createElement("article");
    article.className = "program-card";

    const number = document.createElement("span");
    number.className = "number";
    number.textContent = String(index + 1).padStart(2, "0");

    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = program.title;
    const summary = document.createElement("p");
    summary.textContent = program.summary;
    content.append(title, summary);

    const status = document.createElement("span");
    status.className = "draft";
    status.textContent = program.status.toUpperCase();

    article.append(number, content, status);
    list.append(article);

    const option = document.createElement("option");
    option.value = program.id;
    option.textContent = program.title;
    select.append(option);
  }
}

form.addEventListener("input", clearLatestResult);
aiStatusInput.addEventListener("change", syncAiNote);
teamCodeInput.addEventListener("blur", normalizedTeamCode);

form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    latestResult = buildResultCard();
    adapter.save(latestResult);
    downloadButton.disabled = false;
    setMessage(`${latestResult.teamCode}의 결과카드를 이 브라우저에 저장했습니다.`, "success");
  } catch (error) {
    clearLatestResult();
    setMessage(error.message, "error");
  }
});

loadButton.addEventListener("click", () => {
  try {
    const program = selectedProgram();
    if (!program) throw new Error("프로그램을 먼저 선택해 주세요.");
    const teamCode = normalizedTeamCode();
    const stored = adapter.load(program.id, teamCode);
    if (!stored) {
      clearLatestResult();
      setMessage("이 기기와 브라우저에서 일치하는 저장본을 찾지 못했습니다.", "error");
      return;
    }

    applyResultCard(stored);
    latestResult = stored;
    downloadButton.disabled = false;
    setMessage(`${teamCode}의 저장본을 불러왔습니다.`, "success");
  } catch (error) {
    clearLatestResult();
    setMessage(error.message, "error");
  }
});

downloadButton.addEventListener("click", () => {
  try {
    if (!latestResult) throw new Error("먼저 결과카드를 저장하거나 불러와 주세요.");
    downloadResultCard(latestResult);
    setMessage("JSON 파일을 내려받았습니다.", "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

removeButton.addEventListener("click", () => {
  try {
    const program = selectedProgram();
    if (!program) throw new Error("프로그램을 먼저 선택해 주세요.");
    const teamCode = normalizedTeamCode();
    if (!globalThis.confirm(`${program.title}의 ${teamCode} 저장본을 삭제할까요?`)) return;
    adapter.remove(program.id, teamCode);
    clearLatestResult();
    form.reset();
    syncAiNote();
    setMessage(`${teamCode}의 브라우저 저장본을 삭제했습니다.`, "success");
  } catch (error) {
    setMessage(error.message, "error");
  }
});

try {
  adapter = createStandaloneAdapter();
  await loadPrograms();
  renderPrograms();
  syncAiNote();
} catch (error) {
  list.innerHTML =
    '<p class="load-error">프로그램을 불러오지 못했습니다. <code>npm run dev</code>로 다시 실행해 주세요.</p>';
  form.hidden = true;
  setMessage(error.message, "error");
}
