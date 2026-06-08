# =====================================================================================================================
# Stage 1: Base & Build
# =====================================================================================================================
FROM node:22-alpine AS builder

# Habilitar corepack y pnpm 10
RUN corepack enable && corepack use pnpm@10.4

WORKDIR /app

# Copiar archivos del proyecto
COPY . .

# Instalar dependencias, generar Prisma Client y compilar
RUN pnpm install --frozen-lockfile
RUN pnpm exec prisma generate 
RUN pnpm build 

# Eliminar dependencias de desarrollo para dejar solo las de producción
RUN pnpm prune --prod

# =====================================================================================================================
# Stage 2: Final Production Image
# =====================================================================================================================
FROM node:22-alpine AS prod

# Instalar dependencias del sistema y configurar zona horaria (Asunción)
RUN apk update && \
    apk add --no-cache openssl tzdata && \
    cp /usr/share/zoneinfo/America/Asuncion /etc/localtime && \
    echo "America/Asuncion" > /etc/timezone

# Configurar variables de entorno de producción
ENV NODE_ENV=production
ENV TZ=America/Asuncion

WORKDIR /app

# Crear un usuario no-root por seguridad
RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeuser -u 1001 -G nodeapp

# Copiar únicamente lo necesario desde la etapa de construcción con los permisos del usuario
COPY --from=builder --chown=nodeuser:nodeapp /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodeapp /app/dist ./dist
COPY --from=builder --chown=nodeuser:nodeapp /app/package.json ./package.json

# Si usas Prisma, necesitas también el esquema generado en producción para que el cliente funcione
COPY --from=builder --chown=nodeuser:nodeapp /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder --chown=nodeuser:nodeapp /app/prisma ./prisma

# Cambiar al usuario no-root
USER nodeuser

# Exponer el puerto de la aplicación
EXPOSE 3000

# Comando optimizado ejecutando directamente el binario de Node (evita intermediarios)
CMD ["node", "dist/main"]