FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema para Prisma
RUN apk add --no-cache openssl

# Copiar archivos necesarios
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependencias y generar cliente Prisma
RUN npm install
RUN npx prisma generate

# Copiar el resto de la aplicación
COPY . .

# Construir la aplicación
RUN npm run build

# Puerto expuesto (solo documentación, Railway lo maneja internamente)
EXPOSE 8080

# Comando de inicio adaptado para Railway
CMD ["node", "dist/server.js"]