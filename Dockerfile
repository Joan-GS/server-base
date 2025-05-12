# Etapa de build
FROM node:20.11.1-slim AS builder

ENV NODE_ENV=build

RUN apt-get update && apt-get install -y openssl ca-certificates \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN useradd --user-group --create-home --shell /bin/false nodeuser
WORKDIR /home/nodeuser

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate \
    && npm run build \
    && npm prune --omit=dev

# Etapa de producción
FROM node:20.11.1-slim AS production

ENV NODE_ENV=production

# 👇 Aquí instalamos OpenSSL 1.1 y certificados raíz
RUN apt-get update && \
    apt-get install -y openssl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN useradd --user-group --create-home --shell /bin/false nodeuser
WORKDIR /home/nodeuser
USER nodeuser

COPY --from=builder /home/nodeuser/package*.json ./
COPY --from=builder /home/nodeuser/node_modules/ ./node_modules/
COPY --from=builder /home/nodeuser/dist/ ./dist/

CMD ["node", "dist/server.js"]
