# PRODUCTION DOCKERFILE
# ---------------------
FROM node:20-alpine as builder

ENV NODE_ENV build

WORKDIR /home/node

# Instala las dependencias del sistema como root (antes de cambiar de usuario)
RUN apk add --no-cache openssl

# Ahora cambiamos al usuario node
USER node

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .
RUN npx prisma generate \
    && npm run build \
    && npm prune --omit=dev

# ---

FROM node:20-alpine

ENV NODE_ENV production

WORKDIR /home/node

# Instala openssl como root primero
RUN apk add --no-cache openssl

# Luego cambia al usuario node
USER node

COPY --from=builder --chown=node:node /home/node/package*.json ./
COPY --from=builder --chown=node:node /home/node/node_modules/ ./node_modules/
COPY --from=builder --chown=node:node /home/node/dist/ ./dist/

CMD ["node", "dist/server.js"]