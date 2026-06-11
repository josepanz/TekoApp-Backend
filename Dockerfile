# =====================================================================================================================
# Stage 1: Build
# =====================================================================================================================
FROM node:22-alpine AS builder

RUN corepack enable && corepack use pnpm@10.4

WORKDIR /app

# Copiar manifiestos de dependencias primero — optimiza cache de capas.
# Docker solo re-ejecuta pnpm install si package.json o pnpm-lock.yaml cambian.
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar schema de Prisma antes de generate (separado del código fuente)
COPY prisma ./prisma
RUN pnpm exec prisma generate

# Copiar el resto del código fuente y compilar
COPY . .
RUN pnpm build

# Eliminar devDependencies — deja solo lo necesario para producción
RUN pnpm prune --prod

# =====================================================================================================================
# Stage 2: Production
# =====================================================================================================================
FROM node:22-alpine AS prod

RUN apk update && \
    apk add --no-cache openssl tzdata && \
    cp /usr/share/zoneinfo/America/Asuncion /etc/localtime && \
    echo "America/Asuncion" > /etc/timezone

ENV NODE_ENV=production
ENV TZ=America/Asuncion

WORKDIR /app

RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeuser -u 1001 -G nodeapp

# Copiar solo los artefactos necesarios desde el builder
COPY --from=builder --chown=nodeuser:nodeapp /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodeapp /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodeapp /app/package.json ./package.json
COPY --from=builder --chown=nodeuser:nodeapp /app/prisma ./prisma

USER nodeuser

EXPOSE 3000

CMD ["node", "dist/main"]
