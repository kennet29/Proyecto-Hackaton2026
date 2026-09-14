# Stage 1: Build Angular application
FROM node:20-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve static content with Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/dist/landingpage /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 4200

CMD ["nginx", "-g", "daemon off;"]
