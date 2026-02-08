# 🔧 Resolver Erro "No such container: select-a-container"

## 🎯 Problema
Dokploy não consegue fazer deploy porque os serviços não estão completamente configurados.

---

## ✅ Solução: API

### 1. Atualizar Environment Variables

No serviço **API** → **Environment**:

**Substitua o `DATABASE_URL` por:**
```
postgresql://postgres:PGr8ypRyJygSKrEMQxHx@frota2026-frotapostgres-s51lai:5432/postgres
```

**Variáveis completas que devem estar:**
```env
DATABASE_URL=postgresql://postgres:PGr8ypRyJygSKrEMQxHx@frota2026-frotapostgres-s51lai:5432/postgres
JWT_SECRET=Super_Secret_JWT_Key_Change_Me_64_Chars_Random
STORAGE_ENDPOINT=http://minio:9000
STORAGE_BUCKET=frota-uploads
STORAGE_REGION=us-east-1
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=MinioSecure2024!
PORT=3000
NODE_ENV=production
```

### 2. Configurar Porta

**General** → **Ports**:
- **Container Port:** `3000`
- **Expose:** ✅ On

### 3. Configurar Domínio

**Domains** → **Add Domain**:
- **Domain:** `johnatamoreira.com.br`
- **Path:** `/api`
- **Container Port:** `3000`
- **HTTPS:** ✅

### 4. Deploy

Click **Deploy** (botão verde no topo)

---

## ✅ Solução: Web Frontend

### 1. Verificar Provider

**General** → Confirmar:
- **Provider:** GitHub ✅
- **Repository:** `antigravity_frota2026` ✅
- **Branch:** `main` ✅
- **Build Path:** `/apps/web/Dockerfile` ✅

### 2. Configurar Porta

**General** → **Ports**:
- **Container Port:** `80`
- **Expose:** ✅ On

### 3. Configurar Domínio

**Domains** → **Add Domain**:
- **Domain:** `johnatamoreira.com.br`
- **Path:** `/` (raiz)
- **Container Port:** `80`
- **HTTPS:** ✅

### 4. Deploy

Click **Deploy**

---

## 🚀 Ordem de Deploy

1. ✅ PostgreSQL (já está rodando)
2. ✅ MinIO (já deve estar)
3. 🔄 **API** (redeploy agora)
4. 🔄 **Web** (redeploy depois)

---

## 🔍 Verificar Se Funcionou

Após deploy:

```bash
# Teste API
curl https://johnatamoreira.com.br/api/health

# Teste Web
curl https://johnatamoreira.com.br
```

Ou abra no navegador: **https://johnatamoreira.com.br**

---

## 📊 Executar Migração (Após API Deployed)

**API Service** → **Open Terminal** (ou Console):

```bash
cd /app
npx prisma migrate deploy
```

Se der erro de caminho:
```bash
cd apps/api
npx prisma migrate deploy
```

---

## 🎯 Checklist

- [ ] API Environment variables atualizadas com URL real do PostgreSQL
- [ ] API Domain configurado: `johnatamoreira.com.br/api` porta `3000`
- [ ] Web Domain configurado: `johnatamoreira.com.br/` porta `80`
- [ ] API deployado com sucesso (sem erro de container)
- [ ] Web deployado com sucesso
- [ ] Migração do banco executada
- [ ] Site abre em https://johnatamoreira.com.br

---

**Pronto!** 🎉
