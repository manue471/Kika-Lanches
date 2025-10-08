# 📦 RESUMO DO DEPLOY - Frontend Kika Lanches

## ✅ ALTERAÇÕES REALIZADAS NO PROJETO LOCAL

### 1. **Arquivos de Ambiente**
- ✅ Criado `.env` com variáveis de produção
- ✅ Criado `.env.example` para documentação
- ✅ Adicionado `.env` ao `.gitignore`

### 2. **Dockerfile** 
- ✅ Alterado para `npm ci` (build completo)
- ✅ Adicionado ARG para variáveis de ambiente (`VITE_API_URL`, `VITE_TENANT_ID`)
- ✅ Adicionado ENV para injetar variáveis no build
- ✅ Adicionado Healthcheck
- ✅ Descomentado CMD para iniciar Nginx

### 3. **Nginx Config (docker/nginx/nginx.conf)**
- ✅ Alterado `server_name` para `_` (aceita qualquer hostname)
- ✅ Adicionado compressão gzip
- ✅ Otimizado cache de assets estáticos
- ✅ Removido CSP que poderia bloquear API

### 4. **Vite Config (vite.config.ts)**
- ✅ Adicionado configuração de build otimizada
- ✅ Configurado `minify: 'esbuild'`
- ✅ Configurado chunks manuais (vendor, ui, http)
- ✅ Adicionado proxy para desenvolvimento local
- ✅ Desabilitado sourcemaps em produção

### 5. **Docker Compose Produção (docker/docker-compose.prod.yml)**
- ✅ Removido mapeamento de portas (proxy acessa internamente)
- ✅ Removido volumes desnecessários
- ✅ Adicionado build args com variáveis de ambiente
- ✅ Adicionado healthcheck
- ✅ Configurado network `proxy` (externa)

### 6. **Script de Deploy**
- ✅ Criado `deploy.sh` para facilitar build e push da imagem

---

## 🚀 PRÓXIMOS PASSOS (EXECUTAR NO SERVIDOR)

### 📍 **Passo 1: Atualizar Proxy Nginx**

O arquivo `DEPLOY_COMANDOS.md` contém todos os comandos detalhados, mas resumidamente:

```bash
# No servidor srv1039878
cd /var/www/proxy
cp nginx.conf nginx.conf.backup  # Backup

# Atualizar nginx.conf com suporte ao frontend
# (Ver conteúdo completo em DEPLOY_COMANDOS.md)

docker-compose restart nginx
```

### 📍 **Passo 2: Build e Push da Imagem (SEU COMPUTADOR)**

```bash
# No seu computador
cd /Users/pabloemanuel/dev/kika-lanches

# Opção 1: Usar script automatizado
./deploy.sh

# Opção 2: Comandos manuais
docker build \
  --build-arg VITE_API_URL=http://kikapp.cloud/api \
  --build-arg VITE_TENANT_ID=1 \
  -t pabloemanuel/kikapp-fe:latest .

docker push pabloemanuel/kikapp-fe:latest
```

### 📍 **Passo 3: Deploy no Servidor**

```bash
# No servidor srv1039878
mkdir -p /var/www/kikapp-frontend
cd /var/www/kikapp-frontend

# Criar docker-compose.prod.yml
# (Ver conteúdo em DEPLOY_COMANDOS.md)

docker pull pabloemanuel/kikapp-fe:latest
docker-compose -f docker-compose.prod.yml up -d
```

### 📍 **Passo 4: Verificar**

```bash
# Verificar containers
docker ps | grep kikapp

# Testar acesso
curl -I http://kikapp.cloud
curl -I http://kikapp.cloud/api/register
```

---

## 🏗️ ARQUITETURA FINAL

```
Internet
   ↓
Nginx Proxy (kikapp-proxy:80) ← porta 80 e 443 abertas
   ├─→ / → Frontend (kikapp-fe:80)
   └─→ /api/ → Backend API (nginx:80)
```

**Network Docker:** `proxy` (external)

---

## 📋 CHECKLIST DE VERIFICAÇÃO

### Antes do Deploy:
- [x] `.env` criado com variáveis corretas
- [x] Build local funciona (`npm run build`)
- [x] Dockerfile atualizado
- [x] nginx.conf otimizado
- [x] vite.config.ts configurado

### Durante Deploy:
- [ ] Imagem Docker buildada com sucesso
- [ ] Imagem enviada para Docker Hub
- [ ] Proxy nginx atualizado no servidor
- [ ] Container frontend iniciado
- [ ] Container na network `proxy`

### Após Deploy:
- [ ] Frontend acessível em http://kikapp.cloud
- [ ] API funcionando em http://kikapp.cloud/api/
- [ ] SPA routing funciona (F5 não dá 404)
- [ ] Assets estáticos carregam
- [ ] Sem erros no console

---

## 📁 ARQUIVOS DE REFERÊNCIA

1. **DEPLOY_COMANDOS.md** - Todos os comandos para executar no servidor
2. **deploy.sh** - Script automatizado de build e push
3. **.env.example** - Exemplo de variáveis de ambiente
4. **Dockerfile** - Build multi-stage atualizado
5. **docker/nginx/nginx.conf** - Configuração Nginx do frontend
6. **docker/docker-compose.prod.yml** - Compose de produção

---

## 🔄 FLUXO DE ATUALIZAÇÃO FUTURA

Quando precisar atualizar o frontend:

```bash
# 1. No seu computador
cd /Users/pabloemanuel/dev/kika-lanches
git pull  # Pegar últimas alterações
npm run build  # Testar build
./deploy.sh  # Build e push da imagem

# 2. No servidor
cd /var/www/kikapp-frontend
docker pull pabloemanuel/kikapp-fe:latest
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
docker logs kikapp-fe -f
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

**Frontend não carrega:**
```bash
docker logs kikapp-fe --tail 50
docker restart kikapp-fe
```

**Erro 502 Bad Gateway:**
```bash
docker network inspect proxy | grep kikapp-fe
docker-compose -f /var/www/proxy/docker-compose.yaml restart
```

**API não funciona:**
```bash
docker logs kikapp-proxy --tail 50
curl -I http://kikapp.cloud/api/register
```

---

## 🎯 CONFIGURAÇÕES IMPORTANTES

**Variáveis de Ambiente (Build Time):**
- `VITE_API_URL=http://kikapp.cloud/api`
- `VITE_TENANT_ID=1`

**Portas:**
- Proxy Nginx: 80 e 443 (externas)
- Frontend: 80 (interna, sem exposição externa)
- Backend: 80 (interna, sem exposição externa)

**Networks:**
- `proxy` (external) - Conecta todos os containers

---

## ✨ RESULTADO ESPERADO

Após executar todos os passos:

1. ✅ Frontend disponível em: **http://kikapp.cloud**
2. ✅ Backend API disponível em: **http://kikapp.cloud/api/**
3. ✅ SPA routing funcionando (Vue Router)
4. ✅ Assets com cache otimizado
5. ✅ Compressão gzip ativa
6. ✅ Security headers configurados

---

**🚀 Pronto para deploy em produção!**

Qualquer dúvida, consulte o arquivo `DEPLOY_COMANDOS.md` para comandos detalhados.

