# Stage 1: Build Expo Web application
FROM node:20-slim AS builder

WORKDIR /app

# Accept build-time API URL argument
ARG EXPO_PUBLIC_API_URL=https://nicaplus.takenjo.lat/api/v1
ENV EXPO_PUBLIC_API_URL=${EXPO_PUBLIC_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx expo export --platform web

# Stage 2: Serve static bundle with Nginx
FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
RUN ln -s /usr/share/nginx/html /usr/share/nginx/html/app
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8081

CMD ["nginx", "-g", "daemon off;"]
