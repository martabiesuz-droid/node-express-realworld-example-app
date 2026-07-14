# Stage 1: Build
FROM node:18-slim AS build
WORKDIR /app
COPY package*.json ./
COPY nx.json ./
COPY project.json ./
COPY tsconfig*.json ./
COPY jest.preset.js ./
COPY src ./src
RUN npm ci
RUN npx nx build api

# Stage 2: Runtime
FROM node:18-slim
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN addgroup --system api && \
        adduser --system --ingroup api api
COPY --from=build /app/dist/api api
COPY --from=build /app/src/prisma/schema.prisma api/src/prisma/schema.prisma
COPY docs/ api/docs/
RUN chown -R api:api .
RUN npm --prefix api --omit=dev -f install
RUN cd api && npx prisma@4.16.2 generate --schema=src/prisma/schema.prisma
CMD [ "node", "api" ]