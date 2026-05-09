FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build NestJS (skip for dev mode)
# RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main"]
