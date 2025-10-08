# Step 1: Build application
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build args para variáveis de ambiente
ARG VITE_API_URL
ARG VITE_TENANT_ID

# Definir variáveis de ambiente para o build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_TENANT_ID=${VITE_TENANT_ID}

# Build da aplicação
RUN npm run build

# Step 2: Serve application with Nginx
FROM nginx:alpine

# Remover configuração padrão
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuração customizada
COPY ./docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]