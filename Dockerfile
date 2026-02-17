# Multi-stage Dockerfile: build the Vite app then serve with nginx
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Copy source and build
COPY . .
RUN npm run build

FROM nginx:stable-alpine

# Replace default nginx conf with SPA-friendly configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
