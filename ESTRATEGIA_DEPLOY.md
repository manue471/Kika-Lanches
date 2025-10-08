# 🎯 ESTRATÉGIA DE DEPLOY - Manual vs Pipeline

## ✅ BOA NOTÍCIA: Você já tem pipeline configurada!

O arquivo `.github/workflows/deploy.yaml` já existe e foi **atualizado** com as correções necessárias.

---

## 🔄 FLUXO COMPLETO DE DEPLOY

### **OPÇÃO 1: DEPLOY MANUAL (Primeira Vez - HOJE)**

Use para validar que tudo funciona antes de confiar na pipeline.

#### Passo 1: No seu computador
```bash
cd /Users/pabloemanuel/dev/kika-lanches

# Build e push manual
docker login
./deploy.sh
```

#### Passo 2: No servidor
```bash
# Copie e cole os comandos do arquivo COMANDOS_SERVIDOR.txt
```

✅ **Vantagem:** Você controla cada passo e vê os erros em tempo real

---

### **OPÇÃO 2: DEPLOY AUTOMÁTICO (Pipeline - SEMPRE)**

Após validar manualmente, use a pipeline para todos os próximos deploys.

#### Como funciona:
```bash
# No seu computador
git add .
git commit -m "feat: add ticket system"
git push origin main
```

**GitHub Actions faz automaticamente:**
1. ✅ Checkout do código
2. ✅ Login no Docker Hub
3. ✅ Build da imagem (com variáveis de ambiente)
4. ✅ Push para Docker Hub
5. ✅ Copia docker-compose.prod.yml para servidor
6. ✅ SSH no servidor
7. ✅ Pull da nova imagem
8. ✅ Restart do container
9. ✅ Reload do Nginx
10. ✅ Verifica containers rodando

✅ **Vantagem:** Deploy com um único `git push`

---

## 🔧 CORREÇÕES FEITAS NA PIPELINE

### Antes (problemas):
```yaml
- docker build -t .../kikapp-fe:latest . .  # ❌ Dois pontos no final
- target: "/var/www/kikapp-api/"            # ❌ Pasta errada
- mkdir -p /var/www/kikapp-fe cd ...        # ❌ Faltava quebra de linha
```

### Depois (corrigido):
```yaml
- docker build \
    --build-arg VITE_API_URL=http://kikapp.cloud/api \  # ✅ Variáveis de ambiente
    --build-arg VITE_TENANT_ID=1 \
    -t .../kikapp-fe:latest .                            # ✅ Um ponto só

- target: "/var/www/kikapp-frontend/"                   # ✅ Pasta correta

- script: |
    mkdir -p /var/www/kikapp-frontend                   # ✅ Comandos corretos
    cd /var/www/kikapp-frontend
    docker compose -f docker-compose.prod.yml pull
    docker compose -f docker-compose.prod.yml up -d --remove-orphans
    docker exec kikapp-api-nginx nginx -s reload        # ✅ Reload do nginx
```

---

## 🎯 MINHA RECOMENDAÇÃO FINAL

### **HOJE (Primeira vez):**

**1. Deploy MANUAL primeiro** para garantir que:
- ✅ Nginx do backend aceita a configuração
- ✅ Container frontend sobe corretamente
- ✅ Network proxy está funcionando
- ✅ Acesso externo funciona

**Comandos:**
```bash
# Seu computador
./deploy.sh

# Servidor (COMANDOS_SERVIDOR.txt)
# ... comandos manuais
```

---

### **DEPOIS (Próximos deploys):**

**2. Use a PIPELINE para tudo:**

```bash
# Basta fazer commit e push
git add .
git commit -m "fix: correções no frontend"
git push origin main

# GitHub Actions faz o resto automaticamente!
```

Monitore em: https://github.com/seu-usuario/kika-lanches/actions

---

## 🔐 SECRETS NECESSÁRIOS NO GITHUB

Verifique se você já tem configurados em:
**GitHub → Settings → Secrets and variables → Actions**

Necessários:
- ✅ `DOCKER_USERNAME` - Seu usuário do Docker Hub
- ✅ `DOCKER_TOKEN` - Token do Docker Hub
- ✅ `SERVER_IP` - IP do servidor (srv1039878)
- ✅ `SERVER_SSH_PORT` - Porta SSH (22 ou outra)
- ✅ `SERVER_USER` - kika-god
- ✅ `SERVER_SSH_KEY` - Chave SSH privada

---

## 📋 PLANO DE EXECUÇÃO

### **DIA 1 (HOJE):**
1. ✅ Deploy manual para validar
2. ✅ Testar tudo funcionando
3. ✅ Confirmar que está no ar

### **DIA 2 (AMANHÃ):**
1. ✅ Fazer uma pequena alteração no código
2. ✅ Commit e push
3. ✅ Acompanhar pipeline executando
4. ✅ Validar que deploy automático funciona

### **DIA 3+ (SEMPRE):**
1. ✅ Só fazer `git push`
2. ✅ Pipeline cuida de tudo
3. ✅ Monitora via GitHub Actions

---

## 🚀 RESPOSTA DIRETA

**Pergunta:** Criar container manualmente ou pela pipeline?

**Resposta:**

**HOJE (primeira vez):**
```
👉 MANUAL no servidor (validar tudo)
```

**SEMPRE (após validar):**
```
👉 PIPELINE (git push e pronto!)
```

**A pipeline JÁ ESTÁ PRONTA E CORRIGIDA!** ✅

---

## 📝 PRÓXIMO PASSO

Execute os comandos manuais HOJE para validar. Depois, qualquer alteração você só precisa fazer:

```bash
git add .
git commit -m "sua mensagem"
git push origin main
```

E a pipeline faz deploy automaticamente! 🎉

Quer executar o deploy manual agora?

