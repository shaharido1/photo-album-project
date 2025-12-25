FROM node:22-alpine AS client-builder

WORKDIR /app

# Copy root tsconfig.json (client extends it)
COPY tsconfig.json ./tsconfig.json

WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client/ .

RUN npm run build

FROM node:22-alpine AS server-builder

WORKDIR /app

# Copy root tsconfig.json (server extends it)
COPY tsconfig.json ./tsconfig.json

COPY server/package*.json ./server/

WORKDIR /app/server

RUN npm ci

# Build server TypeScript
COPY server/tsconfig.json ./tsconfig.json
COPY server/src ./src
RUN npx tsc

FROM node:22-alpine

WORKDIR /app

# Copy root package.json first to get version info
COPY package.json ./root-package.json

COPY server/package*.json ./

RUN npm ci --only=production

# Copy compiled server from builder
COPY --from=server-builder /app/server/dist ./dist

COPY --from=client-builder /app/client/dist ./client/dist

# Extract version from package.json for labeling
ARG APP_VERSION
LABEL org.opencontainers.image.version="${APP_VERSION}"
LABEL org.opencontainers.image.title="Photo Album Project"
LABEL org.opencontainers.image.description="Photo Album full-stack application"

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
