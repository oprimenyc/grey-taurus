FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY tsconfig.base.json ./
COPY tsconfig.json ./

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

EXPOSE 5000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
