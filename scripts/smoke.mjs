import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import process from "node:process";

const child = spawn(process.execPath, ["scripts/serve.mjs"], {
  cwd: new URL("../", import.meta.url),
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
  const routes = ["/", "/demo/", "/programs/catalog.json", "/schemas/result-card.schema.json"];

  for (const route of routes) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 200, `${route} 응답 상태`);
    assert.match(response.headers.get("content-security-policy") || "", /connect-src 'self'/);
  }

  const demo = await (await fetch(`${baseUrl}/demo/`)).text();
  assert.match(demo, /id="result-form"/);
  assert.match(demo, /강사용 3분 시작/);

  const catalog = await (await fetch(`${baseUrl}/programs/catalog.json`)).json();
  assert.equal(catalog.publisher, "Nextbridge");
  assert.equal(catalog.programs.length, 3);

  console.log("Standalone smoke passed.");
} finally {
  stop();
}
