# Step 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build

# Step 2: Serve application with Nginx
# FROM nginx:alpine

# COPY --from=builder /app/dist /usr/share/nginx/html
# COPY --from=builder /app/nginx.conf /etc/nginx/nginx.conf

# EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]