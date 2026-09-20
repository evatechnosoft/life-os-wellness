# fit.evaitec.com serves both halves from one image: the built PWA and the API that
# feeds it. Same origin means no CORS for the browser and one hostname to remember.
FROM node:24-alpine AS web
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN npm ci
COPY ops ./ops
COPY apps/web ./apps/web
# Icons are generated, not committed; the manifest points at them.
RUN node ops/gen_icons.mjs && npm run build -w @wellness/web

# Node 24+ runs .ts directly (type stripping), so there is no build step to keep in sync.
FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --omit=dev --workspace @wellness/api --include-workspace-root

COPY db ./db
COPY apps/api ./apps/api
COPY --from=web /app/apps/web/dist ./apps/web/dist

ENV NODE_ENV=production
ENV WEB_DIST=/app/apps/web/dist
EXPOSE 3011
CMD ["node", "apps/api/src/index.ts"]
