FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY index.html *config.* ./
COPY src ./src
RUN chown -R node:node /app
USER node
EXPOSE 5173
FROM base AS test
COPY --chown=node:node test ./test
CMD ["npm", "test", "--", "--run"]

FROM base AS app
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
