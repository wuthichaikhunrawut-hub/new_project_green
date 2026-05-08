# Stage 1: Build Angular
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build Angular (browser only, no SSR)
RUN npm run build -- --configuration production

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config and copy ours
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Clear default nginx html files
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular files to nginx html folder
COPY --from=builder /app/dist/project-green/browser /usr/share/nginx/html

# Rename index.csr.html to index.html if it exists (Angular SSR builder output)
RUN if [ -f /usr/share/nginx/html/index.csr.html ]; then mv /usr/share/nginx/html/index.csr.html /usr/share/nginx/html/index.html; fi

EXPOSE 80
