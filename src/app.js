import http from "node:http";

// Cria o servidor HTTP sem dependências externas (menos coisa para atualizar e escanear).
export function createApp({ version = "dev", environment = "local" } = {}) {
  return http.createServer((req, res) => {
    const send = (status, body) => {
      res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
        "cache-control": "no-store",
      });
      res.end(JSON.stringify(body));
    };

    if (req.method !== "GET") return send(405, { error: "método não permitido" });

    switch (req.url) {
      case "/health": // usado pelo Kubernetes (liveness/readiness)
        return send(200, { status: "ok" });
      case "/version":
        return send(200, { version, environment });
      case "/":
        return send(200, { message: "docker-node-hardened no ar", version, environment });
      default:
        return send(404, { error: "rota não encontrada" });
    }
  });
}
