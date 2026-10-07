import { createApp } from "./app.js";

const port = Number(process.env.PORT || 3000);
const version = process.env.APP_VERSION || "dev";
const environment = process.env.APP_ENV || "local";

const server = createApp({ version, environment });

server.listen(port, () => {
  console.log(JSON.stringify({ level: "info", msg: "servidor iniciado", port, version, environment }));
});

// Desliga com calma quando o Kubernetes manda parar (SIGTERM): termina as requisições em andamento
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    console.log(JSON.stringify({ level: "info", msg: `recebido ${signal}, encerrando` }));
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
