import { createStandaloneAdapter, downloadResultCard } from "../src/adapters/standalone.js";

const programs = [
  {
    id: "program-01",
    title: "사업 1 · 이름 확정 예정",
    summary: "첫 번째 교육사업의 수업 자료와 독립 실행 활동이 들어갈 자리입니다."
  },
  {
    id: "program-02",
    title: "사업 2 · 이름 확정 예정",
    summary: "두 번째 교육사업의 수업 자료와 독립 실행 활동이 들어갈 자리입니다."
  },
  {
    id: "program-03",
    title: "사업 3 · 이름 확정 예정",
    summary: "세 번째 교육사업의 수업 자료와 독립 실행 활동이 들어갈 자리입니다."
  }
];

const adapter = createStandaloneAdapter();
const list = document.querySelector("#program-list");
const select = document.querySelector("#program-id");
const form = document.querySelector("#result-form");
const download = document.querySelector("#download");
const message = document.querySelector("#message");
let latestResult = null;

for (const [index, program] of programs.entries()) {
  const article = document.createElement("article");
  article.className = "program-card";
  article.innerHTML = `
    <span class="number">0${index + 1}</span>
    <div>
      <h3>${program.title}</h3>
      <p>${program.summary}</p>
    </div>
    <span class="draft">DRAFT</span>
  `;
  list.append(article);

  const option = document.createElement("option");
  option.value = program.id;
  option.textContent = program.title;
  select.append(option);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const programId = select.value;
  const teamCode = document.querySelector("#team-code").value.trim().toUpperCase();
  const summary = document.querySelector("#summary").value.trim();
  const evidence = document.querySelector("#evidence").value.trim();

  latestResult = {
    schemaVersion: "1.0",
    programId,
    programVersion: "0.1.0",
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

