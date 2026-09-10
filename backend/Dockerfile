FROM node:22-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM dependencies AS development
COPY . .
CMD ["npm", "run", "start:dev"]

FROM dependencies AS build
COPY . .
RUN npm run build
# Database driver is PostgreSQL. Excluding optional drivers keeps unused
# sqlite/node-gyp/tar packages out of the production attack surface.
RUN npm prune --omit=dev --omit=optional

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --chown=node:node --from=build /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist ./dist
COPY --chown=node:node --from=build /app/package.json ./package.json

EXPOSE 3001
USER node
CMD ["node", "dist/main"]
