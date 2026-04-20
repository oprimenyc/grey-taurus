FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/hub run build || pnpm --filter @workspace/grey-taurus run build || echo "Frontend build attempted"

RUN pnpm --filter @workspace/api-server run build

EXPOSE 5000

CMD ["sh", "-c", "pnpm --filter @workspace/db run push && node artifacts/api-server/dist/index.mjs"]
