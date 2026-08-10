import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

const child = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    HOST: "127.0.0.1",
    PORT: "0"
  },
  stdio: ["ignore", "pipe", "pipe"]
});

let stderr = "";
child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => {
  stderr += chunk;
});

function stop() {
  if (!child.killed) child.kill("SIGTERM");
}

async function serverUrl() {
  return await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      stop();
      reject(new Error(`로컬 서버가 시작되지 않았습니다. ${stderr}`.trim()));
    }, 5000);

    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      const match = chunk.match(/http:\/\/127\.0\.0\.1:(\d+)\//);
      if (!match) return;
      clearTimeout(timeout);
      resolve(`http://127.0.0.1:${match[1]}`);
    });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`로컬 서버가 조기에 종료되었습니다. code=${code} ${stderr}`.trim()));
    });
  });
}

try {
  const baseUrl = await serverUrl();
  const routes = [
    "/",
    "/demo/",
    "/programs/catalog.json",
    "/programs/program-01/manifest.json",
    "/programs/program-01/instructor-guide.md",
    "/programs/program-01/tool/index.html",
    "/programs/program-01/tool/styles.css",
    "/programs/program-01/tool/data.js",
    "/programs/program-01/tool/engine.js",
    "/programs/program-01/tool/result-card.js",
    "/programs/program-01/tool/core.js",
    "/programs/program-01/tool/app-state.js",
    "/programs/program-01/tool/app-export.js",
    "/programs/program-01/tool/app-controls.js",
    "/programs/program-01/tool/app-render.js",
    "/programs/program-01/tool/app-events.js",
    "/schemas/result-card.schema.json",
    "/docs/program-status.md"
  ];

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} 응답 상태`);
    assert.match(response.headers.get("content-security-policy") || "", /connect-src 'self'/);
  }

  const demo = await (await fetch(`${baseUrl}/demo/`)).text();
  assert.match(demo, /id="result-form"/);
  assert.match(demo, /강사용 3분 시작/);
  assert.match(demo, /첫 번째 사업에는 로그인 없는 실습 도구/);
  assert.doesNotMatch(demo, /실제 사업명은 아직 확정하지 않았습니다/);

  const catalog = await (await fetch(`${baseUrl}/programs/catalog.json`)).json();
  assert.equal(catalog.publisher, "Nextbridge");
  assert.equal(catalog.programs.length, 3);

  const firstProgram = await (
    await fetch(`${baseUrl}/programs/program-01/manifest.json`)
  ).json();
  assert.equal(firstProgram.title, "2026 찾아가는 AI교육 지원 프로그램");
  assert.equal(firstProgram.delivery.status, "partial");
  assert.equal(firstProgram.resources.status, "published");
  assert.equal(firstProgram.resources.studentTool, "./tool/index.html");

  const tool = await (await fetch(`${baseUrl}/programs/program-01/tool/index.html`)).text();
  assert.match(tool, /AI 공정성 감사관/);
  assert.match(tool, /실제 AI 모델이 아닙니다/);
  assert.match(tool, /공통 결과카드 1\.1/);

  console.log("Standalone smoke passed.");
} finally {
  stop();
}
