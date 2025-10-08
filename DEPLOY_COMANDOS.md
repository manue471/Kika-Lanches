# 🚀 Comandos para Deploy do Frontend no Servidor

## 📋 PARTE 1: ATUALIZAR PROXY NGINX

Execute estes comandos no servidor (`srv1039878`):

```bash
# 1. Fazer backup da configuração atual
cd /var/www/proxy
cp nginx.conf nginx.conf.backup

# 2. Atualizar configuração do Nginx com suporte ao frontend
cat > nginx.conf << 'EOF'
events {}

http {
    upstream kikapp_api {
        server nginx:80;  # Backend API
    }

    upstream kikapp_frontend {
        server kikapp-fe:80;  # Frontend
    }

    server {
        listen 80;
        server_name kikapp.cloud;

        # Frontend - TODAS as requisições que NÃO são /api/
        location / {
            proxy_pass http://kikapp_frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API - requisições /api/
        location /api/ {
            proxy_pass http://nginx:80/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
EOF

# 3. Recarregar configuração do proxy
docker-compose restart nginx

# 4. Verificar logs do proxy
docker logs kikapp-proxy -f
# (Ctrl+C para sair)
```

---

## 📋 PARTE 2: CRIAR ESTRUTURA DO FRONTEND

```bash
# 1. Criar diretório para o frontend
mkdir -p /var/www/kikapp-frontend
cd /var/www/kikapp-frontend

# 2. Criar docker-compose.prod.yml
cat > docker-compose.prod.yml << 'EOF'
services:
  frontend:
    image: pabloemanuel/kikapp-fe:latest
    container_name: kikapp-fe
    restart: always
    networks:
      - proxy
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  proxy:
    external: true
EOF

# 3. Fazer pull da imagem
docker pull pabloemanuel/kikapp-fe:latest

# 4. Subir o container do frontend
docker-compose -f docker-compose.prod.yml up -d

# 5. Verificar se o container está rodando
docker ps | grep kikapp-fe

# 6. Verificar logs do frontend
docker logs kikapp-fe -f
# (Ctrl+C para sair)
```

---

## 📋 PARTE 3: VERIFICAÇÕES

```bash
# 1. Verificar todos os containers
docker ps | grep kikapp

# 2. Verificar network proxy
docker network inspect proxy | grep kikapp

# 3. Testar acesso direto ao frontend (dentro do container)
docker exec kikapp-fe wget -qO- http://localhost | head -20

# 4. Testar conectividade entre containers
docker exec kikapp-fe ping -c 3 nginx
docker exec kikapp-proxy ping -c 3 kikapp-fe

# 5. Testar acesso externo
curl -I http://kikapp.cloud
curl -I http://kikapp.cloud/api/register
```

---

## 📋 PARTE 4: TROUBLESHOOTING (Se necessário)

### Se o frontend não carregar:

```bash
# Verificar logs detalhados
docker logs kikapp-fe --tail 100

# Verificar se o container está saudável
docker inspect kikapp-fe | grep -A 10 Health

# Reiniciar container
docker-compose -f /var/www/kikapp-frontend/docker-compose.prod.yml restart

# Recriar container do zero
docker-compose -f /var/www/kikapp-frontend/docker-compose.prod.yml down
docker-compose -f /var/www/kikapp-frontend/docker-compose.prod.yml up -d
```

### Se houver erro 502 Bad Gateway:

```bash
# Verificar se frontend está na network proxy
docker network inspect proxy | grep kikapp-fe

# Reconectar à network se necessário
docker network connect proxy kikapp-fe

# Recarregar proxy
docker-compose -f /var/www/proxy/docker-compose.yaml restart
```

### Se a API não funcionar:

```bash
# Verificar configuração do proxy
cat /var/www/proxy/nginx.conf

# Verificar logs do proxy
docker logs kikapp-proxy --tail 50

# Testar upstream do backend
docker exec kikapp-proxy wget -qO- http://nginx:80/api/register
```

---

## 📋 PARTE 5: ATUALIZAÇÃO FUTURA

Quando precisar atualizar o frontend:

```bash
# 1. Pull da nova imagem
docker pull pabloemanuel/kikapp-fe:latest

# 2. Recriar container
cd /var/www/kikapp-frontend
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 3. Verificar
docker logs kikapp-fe -f
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Após executar todos os comandos, verifique:

- [ ] Container `kikapp-fe` está rodando: `docker ps | grep kikapp-fe`
- [ ] Container está saudável: `docker inspect kikapp-fe | grep -A 5 Health`
- [ ] Frontend responde em http://kikapp.cloud
- [ ] API responde em http://kikapp.cloud/api/register
- [ ] Não há erros nos logs: `docker logs kikapp-fe`
- [ ] Proxy está funcionando: `docker logs kikapp-proxy`

---

## 🔄 ROLLBACK (Se algo der errado)

```bash
# 1. Parar frontend
docker-compose -f /var/www/kikapp-frontend/docker-compose.prod.yml down

# 2. Restaurar configuração antiga do proxy
cd /var/www/proxy
cp nginx.conf.backup nginx.conf
docker-compose restart nginx

# 3. Verificar
curl -I http://kikapp.cloud/api/register
```

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver todos os containers do projeto
docker ps -a | grep kikapp

# Ver todas as redes
docker network ls | grep proxy

# Ver uso de recursos
docker stats kikapp-fe kikapp-proxy nginx

# Limpar containers parados
docker container prune -f

# Limpar imagens não utilizadas
docker image prune -a -f
```

