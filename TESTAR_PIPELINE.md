# 🚀 TESTAR PIPELINE CI/CD

## ✅ PRÉ-REQUISITOS

Antes de fazer push, verifique se tem estes **secrets** configurados no GitHub:

**Ir para:** https://github.com/seu-usuario/kika-lanches/settings/secrets/actions

**Secrets necessários:**
- `DOCKER_USERNAME` → manue471
- `DOCKER_TOKEN` → Token do Docker Hub
- `SERVER_IP` → IP do servidor (srv1039878)
- `SERVER_SSH_PORT` → 22 (ou porta SSH customizada)
- `SERVER_USER` → kika-god
- `SERVER_SSH_KEY` → Chave SSH privada completa

---

## 📋 PASSO A PASSO

### **1. Verificar alterações locais**

```bash
cd /Users/pabloemanuel/dev/kika-lanches

# Ver o que foi alterado
git status

# Ver diff
git diff
```

### **2. Commit e Push**

```bash
# Adicionar todas as alterações
git add .

# Fazer commit
git commit -m "feat: configuração completa de deploy com nginx e tickets"

# Push para main (vai disparar a pipeline)
git push origin main
```

### **3. Monitorar Pipeline**

1. Acesse: https://github.com/seu-usuario/kika-lanches/actions
2. Clique no workflow "Deploy Frontend"
3. Acompanhe cada step em tempo real
4. Aguarde completar (~2-3 minutos)

---

## 🎯 O QUE A PIPELINE VAI FAZER

### **Job 1: Build**
1. ✅ Checkout do código
2. ✅ Setup Docker Buildx
3. ✅ Login no Docker Hub
4. ✅ Build da imagem para linux/amd64
5. ✅ Push para Docker Hub (manue471/kikapp-fe:latest)
6. ✅ Upload do docker-compose.prod.yml

### **Job 2: Deploy**
1. ✅ Download do docker-compose.prod.yml
2. ✅ Copia arquivo para servidor via SCP
3. ✅ SSH no servidor
4. ✅ Pull da nova imagem
5. ✅ Restart do container
6. ✅ Reload do nginx
7. ✅ Verifica containers

---

## ✅ VERIFICAÇÃO APÓS PIPELINE

Quando a pipeline terminar com sucesso (✓ verde):

### **No servidor:**
```bash
# Verificar containers
docker ps | grep kikapp

# Ver logs do frontend
docker logs kikapp-fe --tail 30

# Ver logs do proxy
docker logs kikapp-proxy --tail 30
```

### **No navegador:**
```bash
# Abrir e testar
http://kikapp.cloud

# Deve mostrar a última versão do código
# Verifique se suas últimas alterações estão lá
```

---

## 🐛 SE A PIPELINE FALHAR

### **Erro no Build:**
- Verificar se secrets estão configurados
- Ver logs detalhados no GitHub Actions

### **Erro no Deploy (SSH):**
- Verificar `SERVER_SSH_KEY` está correto
- Verificar permissões da chave SSH
- Testar SSH manual: `ssh kika-god@srv1039878`

### **Erro no Pull/Up:**
- Verificar se imagem foi enviada: https://hub.docker.com/r/manue471/kikapp-fe
- Ver logs do container no servidor

---

## 🔄 PRÓXIMOS DEPLOYS

Depois que a pipeline funcionar uma vez, **SEMPRE** que quiser fazer deploy:

```bash
git add .
git commit -m "sua mensagem"
git push origin main

# Pipeline faz deploy automático! 🎉
```

---

## 📊 SECRETS DO GITHUB (Checklist)

Verifique se estão todos configurados:

- [ ] `DOCKER_USERNAME` = manue471
- [ ] `DOCKER_TOKEN` = (seu token do Docker Hub)
- [ ] `SERVER_IP` = (IP do srv1039878)
- [ ] `SERVER_SSH_PORT` = 22
- [ ] `SERVER_USER` = kika-god
- [ ] `SERVER_SSH_KEY` = (conteúdo do ~/.ssh/id_rsa ou chave usada)

---

## 🎯 COMMIT E PUSH AGORA

```bash
cd /Users/pabloemanuel/dev/kika-lanches

git add .
git commit -m "feat: deploy completo com nginx, proxy, tickets e CI/CD"
git push origin main
```

**Depois acesse:** https://github.com/seu-usuario/kika-lanches/actions

E acompanhe a mágica acontecer! ✨

