# Step 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build

# Step 2: Serve application with Nginx
FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# CMD ["nginx", "-g", "daemon off;"]