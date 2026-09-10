# Node 24+ runs .ts directly (type stripping), so there is no build step to keep in sync.
FROM node:24-alpine

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
RUN npm ci --omit=dev --workspace @wellness/api --include-workspace-root

COPY db ./db
COPY apps/api ./apps/api

ENV NODE_ENV=production
EXPOSE 3011
CMD ["node", "apps/api/src/index.ts"]
