FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY tsconfig*.json ./
COPY src ./src
COPY database ./database
RUN npm run build
USER node
EXPOSE 3000
FROM base AS test
COPY --chown=node:node test ./test
COPY --chown=node:node jest.config.js ./jest.config.js
CMD ["npm", "test", "--", "--runInBand"]

FROM base AS app
CMD ["node", "dist/main.js"]
