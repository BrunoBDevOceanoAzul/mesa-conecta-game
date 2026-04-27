# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=22.16.0

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY . .
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_MESA_API_URL
ARG NEXT_PUBLIC_ENV
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_MESA_API_URL=${NEXT_PUBLIC_MESA_API_URL}
ENV NEXT_PUBLIC_ENV=${NEXT_PUBLIC_ENV}
RUN npm run build --prefix=frontend
RUN ls -la /app/frontend/dist/index.html || (echo "ERROR: index.html not found" && exit 1)

FROM node:${NODE_VERSION}-alpine AS runtime
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/frontend/dist ./dist
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["serve", "-s", "dist", "-l", "8080"]
