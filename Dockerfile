# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Estágio 1 (deps): instala as dependências de produção com o npm.
# O npm só existe aqui; ele NÃO vai para a imagem final.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
# Se um dia houver pacote privado, o token entra como BuildKit secret (não fica na imagem):
#   RUN --mount=type=secret,id=npm_token NPM_TOKEN=$(cat /run/secrets/npm_token) npm ci --omit=dev
RUN npm ci --omit=dev --no-audit --no-fund \
 && mkdir -p node_modules

# ---------------------------------------------------------------------------
# Estágio 2 (runtime): só o Node + o app. Sem npm, yarn e corepack
# (ferramentas de build que trazem dependências vulneráveis e não são usadas em produção).
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runtime

ARG NODE_ENV=production
ARG APP_VERSION=dev

ENV NODE_ENV=${NODE_ENV} \
    APP_VERSION=${APP_VERSION} \
    PORT=3000

# Aplica as correções de segurança do Alpine (ex.: openssl) e remove as ferramentas de build
RUN apk upgrade --no-cache \
 && rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /usr/local/bin/yarn /usr/local/bin/yarnpkg /opt/yarn-*

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src

# Nunca rodar como root dentro do container
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
