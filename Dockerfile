FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY . .

RUN echo "=== ROOT ===" && ls -la /app/ && echo "=== LIB ===" && ls /app/lib/ 2>/dev/null || echo "NO LIB DIR" && echo "=== ARTIFACTS ===" && ls /app/artifacts/ 2>/dev/null || echo "NO ARTIFACTS DIR" && echo "=== PACKAGE.JSONS ===" && find /app -maxdepth 4 -name "package.json" | sort

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

EXPOSE 5000

CMD ["node", "artifacts/api-server/dist/index.mjs"]
