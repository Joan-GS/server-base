# PRODUCTION DOCKERFILE
# ---------------------
FROM node:20-alpine as builder

ENV NODE_ENV build

USER node
WORKDIR /home/node

# Instala las dependencias del sistema necesarias para Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npx prisma generate \
    && npm run build \
    && npm prune --omit=dev

# ---

FROM node:20-alpine

ENV NODE_ENV production

USER node
WORKDIR /home/node

# Instala openssl en la imagen final también
RUN apk add --no-cache openssl

COPY --from=builder --chown=node:node /home/node/package*.json ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/

CMD ["node", "dist/server.js"]