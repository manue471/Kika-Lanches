# 🧪 TESTE LOCAL COM NGINX + DOCKER

## 🎯 Objetivo

Testar a configuração completa do Nginx localmente antes de fazer deploy em produção.

---

## 🚀 PASSO 1: Build e Start Local

```bash
cd /Users/pabloemanuel/dev/kika-lanches

# Build e start do container local
docker compose -f docker-compose.local.yml up --build
```

**O que vai acontecer:**
1. ✅ Build da aplicação com Vite
2. ✅ Criação da imagem com Nginx
3. ✅ Container rodando na porta 8080

---

## 🧪 PASSO 2: Testar Frontend

### **No Navegador:**
1. Acesse: http://localhost:8080
2. Verifique se a tela de login aparece
3. Teste navegação entre páginas
4. Pressione F5 em diferentes rotas (ex: http://localhost:8080/dashboard)
5. Verifique se NÃO dá erro 404

### **No Terminal:**
```bash
# Testar se o HTML está sendo servido
curl http://localhost:8080 | head -10

# Testar SPA routing (não deve dar 404)
curl -I http://localhost:8080/login
curl -I http://localhost:8080/dashboard
curl -I http://localhost:8080/products

# Testar assets estáticos
curl -I http://localhost:8080/assets/index-DkDffDV-.js
curl -I http://localhost:8080/icons/login-logo.png

# Todos devem retornar 200 OK
```

---

## 🧪 PASSO 3: Testar Conexão com API

```bash
# Entrar no container
docker exec -it kikapp-fe-local sh

# Dentro do container, testar conexão com API de produção
wget -qO- http://kikapp.cloud/api/health || echo "Endpoint não existe"

# Testar DNS
ping -c 3 kikapp.cloud

# Sair do container
exit
```

### **No Navegador (DevTools):**
1. Abra http://localhost:8080
2. Abra DevTools (F12)
3. Vá para aba Network
4. Tente fazer login
5. Verifique se as requisições para `/api/` estão indo para `http://kikapp.cloud/api/`
6. Verifique se há erros de CORS

---

## 🧪 PASSO 4: Verificar Configuração do Nginx

```bash
# Ver configuração do Nginx no container
docker exec kikapp-fe-local cat /etc/nginx/conf.d/default.conf

# Testar configuração
docker exec kikapp-fe-local nginx -t

# Ver logs em tempo real
docker logs kikapp-fe-local -f
# (Ctrl+C para sair)
```

---

## 🧪 PASSO 5: Testar Healthcheck

```bash
# Verificar status do healthcheck
docker inspect kikapp-fe-local | grep -A 10 Health

# Testar manualmente o healthcheck
docker exec kikapp-fe-local wget --quiet --tries=1 --spider http://localhost/
echo $?  # Deve retornar 0 se sucesso
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Frontend:
- [ ] HTML carrega em http://localhost:8080
- [ ] Assets (JS, CSS) carregam sem erro
- [ ] Imagens carregam
- [ ] F5 em qualquer rota NÃO dá 404

### API:
- [ ] Requisições vão para http://kikapp.cloud/api/
- [ ] Login funciona
- [ ] Sem erros de CORS no console

### Nginx:
- [ ] Configuração válida (`nginx -t`)
- [ ] Healthcheck passa
- [ ] Logs sem erros críticos

### Performance:
- [ ] Gzip ativo (verificar no Network → Response Headers)
- [ ] Cache configurado para assets (Cache-Control header)

---

## 🛑 PARAR E LIMPAR

```bash
# Parar container
docker compose -f docker-compose.local.yml down

# Remover imagem local (para rebuildar do zero)
docker rmi kikapp-fe-local 2>/dev/null || true

# Limpar volumes (se necessário)
docker volume prune -f
```

---

## 🔄 REBUILD (Se precisar testar mudanças)

```bash
# Rebuild forçado
docker compose -f docker-compose.local.yml up --build --force-recreate

# Ou rebuildar só a imagem
docker compose -f docker-compose.local.yml build --no-cache
docker compose -f docker-compose.local.yml up
```

---

## 🐛 TROUBLESHOOTING

### Frontend não carrega:
```bash
docker logs kikapp-fe-local --tail 50
docker exec kikapp-fe-local ls -la /usr/share/nginx/html
```

### Erro 404 em rotas:
```bash
docker exec kikapp-fe-local cat /etc/nginx/conf.d/default.conf | grep try_files
# Deve ter: try_files $uri $uri/ /index.html;
```

### Assets não carregam:
```bash
docker exec kikapp-fe-local ls -la /usr/share/nginx/html/assets/
```

### API não conecta:
```bash
# Verificar se consegue acessar API de fora do container
curl http://kikapp.cloud/api/health

# Verificar variáveis de ambiente no build
docker exec kikapp-fe-local cat /usr/share/nginx/html/assets/index-*.js | grep "kikapp.cloud"
```

---

## 📊 COMPARAÇÃO: Dev vs Prod

| Ambiente | URL | Porta | API URL |
|----------|-----|-------|---------|
| **Dev (npm run dev)** | http://localhost:5173 | 5173 | Proxy para kikapp.cloud |
| **Local (Docker)** | http://localhost:8080 | 8080 | http://kikapp.cloud/api |
| **Produção** | http://kikapp.cloud | 80 | http://kikapp.cloud/api |

---

## 🎯 PRÓXIMO PASSO

Execute:
```bash
docker compose -f docker-compose.local.yml up --build
```

E teste no navegador: http://localhost:8080

Me avise o resultado! 🚀

