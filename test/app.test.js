import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

let server;
let base;

before(async () => {
  server = createApp({ version: "1.2.3", environment: "test" });
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test("GET /health responde ok", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: "ok" });
});

test("GET /version mostra versão e ambiente", async () => {
  const res = await fetch(`${base}/version`);
  assert.deepEqual(await res.json(), { version: "1.2.3", environment: "test" });
});

test("rota desconhecida dá 404", async () => {
  const res = await fetch(`${base}/nao-existe`);
  assert.equal(res.status, 404);
});

test("POST não é permitido", async () => {
  const res = await fetch(`${base}/health`, { method: "POST" });
  assert.equal(res.status, 405);
});
