FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/hub run build

RUN test -f artifacts/hub/dist/index.html || (echo "ERROR: artifacts/hub/dist/index.html missing - hub did not build. Check Railway Root Directory is set to repo root, not a subdirectory." && exit 1)

RUN pnpm --filter @workspace/api-server run build

EXPOSE 5000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
