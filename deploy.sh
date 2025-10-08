#!/bin/bash

# Script de deploy do frontend
echo "🚀 Iniciando deploy do Frontend Kika Lanches..."

# Variáveis
DOCKER_USERNAME="pabloemanuel"
IMAGE_NAME="kikapp-fe"
TAG="latest"

# Build da imagem com variáveis de ambiente
echo "📦 Buildando imagem Docker..."
docker build \
  --build-arg VITE_API_URL=http://kikapp.cloud/api \
  --build-arg VITE_TENANT_ID=1 \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG} .

if [ $? -ne 0 ]; then
    echo "❌ Erro ao buildar a imagem!"
    exit 1
fi

echo "✅ Imagem buildada com sucesso!"

# Push para Docker Hub
echo "📤 Enviando imagem para Docker Hub..."
docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}

if [ $? -ne 0 ]; then
    echo "❌ Erro ao enviar imagem!"
    exit 1
fi

echo "✅ Imagem enviada com sucesso!"
echo "🎉 Deploy concluído! Agora execute os comandos no servidor."
