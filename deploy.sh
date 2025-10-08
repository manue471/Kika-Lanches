#!/bin/bash

# Script de deploy do frontend
echo "🚀 Iniciando deploy do Frontend Kika Lanches..."

# Variáveis
DOCKER_USERNAME="manue471"
IMAGE_NAME="kikapp-fe"
TAG="latest"

# Criar builder multi-plataforma se não existir
echo "🔧 Configurando builder multi-plataforma..."
docker buildx create --name multiplatform --use 2>/dev/null || docker buildx use multiplatform

# Build da imagem para linux/amd64 (servidor) com push automático
echo "📦 Buildando imagem Docker para linux/amd64..."
docker buildx build \
  --platform linux/amd64 \
  --build-arg VITE_API_URL=http://kikapp.cloud/api \
  --build-arg VITE_TENANT_ID=1 \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} \
  --push \
  .

if [ $? -ne 0 ]; then
    echo "❌ Erro ao buildar e enviar imagem!"
    exit 1
fi

echo "✅ Imagem buildada e enviada com sucesso para linux/amd64!"
echo "🎉 Deploy concluído! Agora execute os comandos no servidor."
