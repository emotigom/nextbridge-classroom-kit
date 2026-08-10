import { createStandaloneAdapter, downloadResultCard } from "../src/adapters/standalone.js";

const adapter = createStandaloneAdapter();
const list = document.querySelector("#program-list");
const select = document.querySelector("#program-id");
const form = document.querySelector("#result-form");
const download = document.querySelector("#download");
const message = document.querySelector("#message");
let programs = [];
let latestResult = null;

async function loadPrograms() {
  const catalogResponse = await fetch("../programs/catalog.json", { cache: "no-store" });
  if (!catalogResponse.ok) throw new Error("프로그램 목록을 불러오지 못했습니다.");
  const catalog = await catalogResponse.json();
  if (catalog.publisher !== "Nextbridge") throw new Error("프로그램 발행 주체를 확인할 수 없습니다.");

  programs = await Promise.all(
    catalog.programs.map(async (entry) => {
      const manifestUrl = new URL(entry.manifest, new URL("../programs/catalog.json", location.href));
      const response = await fetch(manifestUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`${entry.id} 정보를 불러오지 못했습니다.`);
      const manifest = await response.json();
      if (manifest.id !== entry.id) throw new Error(`${entry.id}의 목록과 manifest가 일치하지 않습니다.`);
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const selectedProgram = programs.find((program) => program.id === select.value);
  if (!selectedProgram) {
    message.textContent = "프로그램을 먼저 선택해 주세요.";
    return;
  }

  const teamCode = document.querySelector("#team-code").value.trim().toUpperCase();
  const summary = document.querySelector("#summary").value.trim();
  const evidence = document.querySelector("#evidence").value.trim();

  latestResult = {
    schemaVersion: "1.0",
    programId: selectedProgram.id,
    programVersion: selectedProgram.version,
    teamCode,
    completedAt: new Date().toISOString(),
    summary,
    evidence: [{ label: "핵심 근거", value: evidence }],
    aiDisclosure: "현재 데모는 생성형 AI를 호출하지 않습니다.",
    privacyChecked: true
  };

  try {
    adapter.save(latestResult);
    download.disabled = false;
    message.textContent = `${teamCode}의 결과카드를 이 브라우저에 저장했습니다.`;
  } catch (error) {
    latestResult = null;
    download.disabled = true;
    message.textContent = error.message;
  }
});

download.addEventListener("click", () => {
  if (latestResult) downloadResultCard(latestResult);
});

try {
  await loadPrograms();
  renderPrograms();
} catch (error) {
  list.innerHTML = '<p class="load-error">프로그램을 불러오지 못했습니다. <code>npm run dev</code>로 다시 실행해 주세요.</p>';
  form.hidden = true;
  message.textContent = error.message;
}

