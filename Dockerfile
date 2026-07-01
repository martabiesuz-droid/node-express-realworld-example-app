FROM docker.io/node:18-slim
ENV HOST=0.0.0.0
ENV PORT=3000
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN addgroup --system api && \
          adduser --system --ingroup api api
COPY dist/api api
COPY src/prisma/schema.prisma api/src/prisma/schema.prisma
COPY docs/ api/docs/
RUN chown -R api:api .
RUN npm --prefix api --omit=dev -f install
RUN cd api && npx prisma@4.16.2 generate --schema=src/prisma/schema.prisma
CMD [ "node", "api" ]
