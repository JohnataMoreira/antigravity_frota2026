#  Lessons Learned: Projeto Frota2026

Este documento detalha os problemas encontrados e as soluções aplicadas durante o deploy do projeto Frota2026. O objetivo é servir como um guia para o Antigravity evitar a repetição de erros em projetos futuros.

## 1. Problemas de Build e Dependências

### Problema 1: Código Incompleto

**Cenário:** O Antigravity enviou código para o repositório que estava incompleto ou com dependências faltando. Isso causou falhas no build do Docker.

**Exemplos:**
- Módulo de `Inventory` adicionado sem as dependências `react-hook-form` e `react-hot-toast`.
- Módulo de `Stock` no backend adicionado sem o `axios`.

**Solução:**
1. **Reverter para um commit estável anterior.**
2. **Remover os arquivos problemáticos.**
3. **Instalar as dependências manualmente.**

**Recomendação para o Antigravity:**
- **Sempre** instale as dependências necessárias **antes** de fazer commit.
- **Sempre** teste o build localmente **antes** de fazer push.

### Problema 2: Incompatibilidade de Versão do Prisma

**Cenário:** O servidor tinha o Prisma 7.4.0, mas o código usava sintaxe do Prisma 6. Isso causou erros de build.

**Solução:**
- Fazer downgrade do Prisma para a versão 6 no `package.json`.

**Recomendação para o Antigravity:**
- **Sempre** verifique a versão das ferramentas no ambiente de produção antes de usar novas funcionalidades.

## 2. Problemas de Configuração do Servidor

### Problema 1: Conflito de Portas

**Cenário:** Containers antigos estavam usando as portas 5432 e 4000, impedindo que os novos containers iniciassem.

**Solução:**
- Parar todos os containers antes de iniciar o deploy.

**Recomendação para o Antigravity:**
- **Sempre** inclua um passo para parar containers antigos no script de deploy.

### Problema 2: Conflito Git

**Cenário:** Mudanças locais no `docker-compose.yml` (correções do Traefik) entraram em conflito com mudanças do repositório.

**Solução:**
- Fazer `git stash` antes do `git pull`.

**Recomendação para o Antigravity:**
- **Sempre** faça commit das suas mudanças locais antes de fazer pull.

## 3. Problemas de Código

### Problema 1: Erro no Mapa (Leaflet)

**Cenário:** O mapa do dashboard exibia o erro `n is not a function`.

**Causa:** O código do Leaflet estava sendo executado no servidor (SSR).

**Solução:**
- Usar `React.lazy` e `Suspense` para carregar o componente do mapa apenas no cliente.

**Recomendação para o Antigravity:**
- **Sempre** use `React.lazy` para componentes que dependem de bibliotecas que só rodam no cliente.

### Problema 2: Crash na Página de Manutenção

**Cenário:** A página de manutenção crashava devido a chamadas de `.toLocaleString()` em dados que podiam ser `undefined`.

**Solução:**
- Adicionar verificações para garantir que os dados existem antes de formatá-los.

**Recomendação para o Antigravity:**
- **Sempre** adicione verificações de nulidade ao acessar dados que podem não existir.

## 4. Fase 3: Estabilização e Branding (Atualização Março/2026)

### Problema 1: Branding Hardcoded
**Cenário:** O nome "Grupo Paraopeba" estava espalhado por vários arquivos (API e Web) de forma estática.
**Solução:** Substituir por `@org?.name` ou termos genéricos como "Frota2026".
**Lição:** Nunca use nomes de clientes em strings estáticas. Use variáveis de ambiente ou dados do banco (Multi-tenant).

### Problema 2: Dashboard "Morto"
**Cenário:** A seção de alertas no dashboard era visual, mas os dados eram estáticos enquanto o backend já tinha suporte a alertas.
**Solução:** Implementar `fetch` real no `ReportsService` e loop dinâmico no `DashboardHome`.
**Lição:** Uma UI que parece funcional mas é estática gera desconfiança. Transforme mocks em realidade assim que o modelo de dados permitir.

### Problema 3: Otimização de Imagem Docker
**Cenário:** O Dockerfile da API estava copiando tudo indiscriminadamente, resultando em imagens de >1GB.
**Solução:** Implementar build multi-stage, usar `node:slim`, e separar a cópia de `package.json` para aproveitar o cache de camadas.
**Lição:** Performance de deploy é crucial. Imagens leves reduzem custos de armazenamento e tempo de start progressivo.

### Problema 4: Gestão de Arquivos de Tarefas
**Cenário:** O Antigravity tentou atualizar o `task.md` assumindo caminhos incorretos ou ignorando sua localização na raiz.
**Solução:** Verificar sempre a raiz do projeto para arquivos de controle.
**Lição:** O `task.md` é a bússola do agente. Se ele estiver corrompido ou inacessível, o agente perde o contexto do progresso.

## 5. Deploy e Infraestrutura Avançada (Março/2026)

### Problema 1: Limite de Recursos VPS (RAM/Swap)
**Cenário:** O deploy em Rolling Update (Dokploy/Swarm default) falhava com 502 Bad Gateway ou "insufficient resources" devido à baixa RAM na VPS (Hetzner).
**Solução:** Escalar o serviço para 0 antes do deploy, rodar `docker system prune -af` para limpar caches de build e imagens órfãs, e então escalar para 1.
**Lição:** Em ambientes de baixa RAM, o custo de manter o container antigo e o novo simultaneamente durante o rollout excede a capacidade do servidor. O downtime momentâneo é preferível ao crash sistêmico.

### Problema 2: Conflitos de Git e Pull Corrompido
**Cenário:** O `git pull` falhava no servidor devido a divergências de branch ou interrupções de conexão, travando o deploy manual.
**Solução:** Forçar sincronia com `git fetch origin && git reset --hard origin/main`.
**Lição:** O servidor de produção nunca deve ter edições manuais. O status deve ser sempre um espelho exato do `main`.

### Problema 3: Residual de Branding (Protocolo Cético)
**Cenário:** Mesmo após reportar remoção do branding "Grupo Paraopeba", greps globais ainda encontravam referências em arquivos de exportação e serviços de notificação.
**Solução:** Implementação técnica do "Protocolo Cético" (Section 5.8 do AGENT_OS). Automação de grep global antes de qualquer push.
**Lição:** A memória do agente é falha; o sistema de arquivos não. Verificação automática > Verificação visual.

### Problema 4: Prisma P3009 — Migração Interrompida em Produção
**Cenário:** Uma migração Prisma (`20260307160000_add_org_branding_and_checklist_template`) foi interrompida durante a execução no deploy. Isso criou um registro na `_prisma_migrations` com `finished_at = NULL`. A cada reinício do container, `prisma migrate deploy` encontrava esse registro corrompido e recusava rodar (erro P3009), criando um loop infinito:
1. Container inicia → `prisma migrate deploy` detecta migração falhada → P3009 → container crash
2. Swarm reinicia container → mesmo erro → crash loop → 502 Bad Gateway

**Tentativas que NÃO funcionaram:**
- `DELETE FROM _prisma_migrations WHERE finished_at IS NULL` → Prisma simplesmente tentava rodar a migração novamente e falhava porque as tabelas já existiam parcialmente
- `INSERT INTO _prisma_migrations` com `checksum='manual_apply'` → Prisma verifica checksums; o checksum incorreto faz ele ignorar o registro e tentar novamente

**Solução correta:**
```bash
# 1. Deletar TODOS os registros da migração problemática
docker exec <postgres_container> psql -U postgres -c \
  "DELETE FROM _prisma_migrations WHERE migration_name = '...';"

# 2. Aplicar o SQL da migração manualmente (se ainda não aplicado)
docker cp migration.sql <postgres_container>:/tmp/
docker exec <postgres_container> psql -U postgres -f /tmp/migration.sql

# 3. Usar prisma migrate resolve (NUNCA INSERT manual)
docker run --rm --network dokploy-network \
  -e DATABASE_URL='...' \
  <api_image> \
  npx prisma migrate resolve --applied <migration_name> --schema=prisma/schema.prisma
```

**Lição:** **NUNCA** insira manualmente na `_prisma_migrations`. O checksum é calculado pelo Prisma e deve ser gerado por ele. Use `prisma migrate resolve --applied` que é o comando oficial para exatamente essa situação.

### Problema 5: Docker Swarm — Deadlock de Serviço com Update Pausado
**Cenário:** O serviço da API ficou em estado `paused` no Docker Swarm. Nem `docker service update --force`, nem `docker service rollback`, nem `docker service scale 0/1` conseguiam resolver. O scheduler do Swarm ficava preso em "insufficient resources" mesmo com RAM disponível.

**Causa raiz:** Dokploy define `Limits.NanoCPUs` e `Reservations.MemoryBytes` no serviço Swarm. Quando o update pausa (por crash do container), o scheduler não consegue alocar recursos para o novo container enquanto mantém a reserva do antigo.

**Solução:**
```bash
# 1. Remover o serviço completamente
docker service rm <service_name>

# 2. Fazer novo deploy limpo via Dokploy Dashboard
# Dokploy recria o serviço do zero sem o estado corrompido

# ⚠️ IMPORTANTE: docker exec -i vs docker exec
# Use 'docker exec' SEM -i para comandos psql via SSH
# O flag -i interfere com pipe/stdin quando executado via SSH remoto
```

**Lição:** Quando o Swarm fica em deadlock, a única solução garantida é remover o serviço e recriar via Dokploy. Tentativas de `update --force` ou `scale 0/1` falham quando o estado de update está `paused`.

### Problema 6: Efeito Cascata de Erro Crítico (Bad Gateway Fatal)
**Cenário:** O dashboard (Web) não abria de jeito nenhum (Bad Gateway 502) no Dokploy, mesmo com o código Web compilando com sucesso.
**Causa Raiz:** O serviço da API (NestJS) possuía um erro de digitação no caminho de um import (`../common/notifications/notification.service` em vez de `../notifications/notifications.service.ts`). O TypeORM/NestJS não compila com caminhos errados.
**O Efeito Cascata:**
1. A API quebrou no `npm run build` ou `docker build`.
2. O Dokploy não conseguiu substituir o container antigo.
3. O Traefik (Proxy Reverso) continuou apontando para um serviço sem instâncias ativas, gerando o Erro 502 no domínio principal inteiro.
**Solução:** Sempre executar `npm run build` ou `tsc --noEmit` localmente na pasta específica do workspace (ex: `apps/api`) **antes** de enviar commits ("Regra de Ouro"). Um único import errado cega o sistema de proxy inteiro no VPS.

## 6. Autenticação e Segurança (Março/2026)

### Problema 1: Persistência de Tokens JWT (Stateless)
**Cenário:** O endpoint `/auth/logout-all` apenas gravava um log de auditoria, mas não invalidava os tokens JWT nos dispositivos. Como o JWT não mantém estado no servidor, os usuários continuavam acessando o sistema.
**Solução Aplicada:** Implementação do campo `tokenVersion` no modelo `User`. Em cada requisição (`JwtStrategy`), o `tokenVersion` do Payload do JWT é comparado com o `tokenVersion` do banco de dados. O endpoint `logout-all` incrementa essa versão no banco, invalidando retroativamente e imediatamente todos os tokens antigos.
**Lição:** Sessões stateless puras com JWT são perigosas em sistemas críticos (onde a revogação imediata é legalmente exigida). O rastreio de versão da sessão (Token Versioning) no banco resolve o problema sem a necessidade do peso de um Redis.

### Problema 2: Invalidação Grosseira (Falta de check do Campo `active`)
**Cenário:** O guardião `JwtStrategy` apenas decodificava o Token. Ele não testava no banco se a conta continuava ativa (`active: true`), permitindo que ex-funcionários usassem o app até a expiração do token.
**Solução Aplicada:** Incorporação da checagem em banco no validador do Passport-JWT.
### Problema 3: Vazamento de Dados Cross-Tenant (Fail-Open Prisma)
**Cenário:** O script `seed-multi-tenant.ts` criava contas e veículos falsos com IDs atrelados a organizações. Ao se registrar uma nova Organização legítima na plataforma de Produção, o novo usuário acessava o painel e enxergava *todos* os veículos e motoristas de *todas* as organizações do banco (um Data Leakage crítico e catastrófico).
**Causa Raiz:**
1. O `TenantMiddleware`, responsável por capturar o `organizationId` do JWT, tentava ler apens a variável `process.env.JWT_SECRET`. Em Produção, a variável predominante era `JWT_ACCESS_SECRET`. Consequentemente, a verificação `jwt.verify` falhava silenciosamente e deixava o `TenantContext` como `undefined`.
2. A falha fatal ocorria no `PrismaService` (`$allOperations` extension): ele implementava uma lógica "Fail-Open". Se a tabela (ex: `Vehicle`) fosse consultada e não houvesse `organizationId` no contexto, ele deduzia que era um script global de sistema ou login e permitia a query sem nenhum filtro `WHERE organizationId = X`.
3. Assim, usuários com tickets válidos via `JwtAuthGuard`, mas sem injeção de Organização via `TenantMiddleware`, faziam bypass do Isolamento e varriam os registros globais de Inquilinos.
**Solução Aplicada (Fail-Closed Architecture):**
1. Sincronizei o secret do `TenantMiddleware` para o fallback oficial: `process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET`.
2. O **PrismaService agora é Fail-Closed:** Se uma Model Isolada for acionada sem o Contexto de Inquilino e SEM uma Flag de Bypass Explícita, ele dispara um `UnauthorizedException()`.
3. Implementei no `TenantContext` o mecanismo `runBypass()`. Rotas como Registro de Conta ou Login (que buscam Usuários globais para ver se o email já existe) agora rodam ativamente sob este Bypass Auditado, trancando permanentemente toda a API contra "Context Loss".
**Lição (Padrão Ouro Multi-Tenancy):**
1. Segurança de Backend NUNCA deve ser Passiva/Fail-Open. Se o ID Multilocatário sumir da memória assíncrona, a API deve **Cair Instantaneamente (Panic/Throw)**, nunca devolver tudo com a presunção inocente de "Consulta do Sistema".
2. Extensões Client-Side do Prisma são poderosas, mas sem Row Level Security (RLS) no banco, exigem um firewall aplicativo blindado em Fail-Closed Mode.


---

## 7. Desenvolvimento Mobile (Fases 16 & 17 - Março/2026)

### Problema 1: Componentes Web em React Native (View vs div)
**Cenário:** Durante a refatoração do `checklist.tsx`, o Antigravity usou acidentalmente a tag `<div>` (padrão Web) em vez de `<View>` (padrão React Native).
**Solução:** Substituir todas as instâncias de `div` por `View`.
**Lição:** Sempre verifique se está em um contexto `mobile` antes de escrever JSX. Tags HTML comuns não funcionam no Native sem bibliotecas específicas.

### Problema 2: Dependências de UI (Linear Gradient)
**Cenário:** O design premium exigia gradientes, mas a biblioteca `expo-linear-gradient` não estava instalada, causando erro de módulo não encontrado.
**Solução:** Instalar via `npx expo install expo-linear-gradient`.
**Lição:** Designs complexos geralmente exigem módulos nativos do Expo. Verifique o `package.json` antes de implementar elementos visuais avançados.

### Problema 3: Sincronização WatermelonDB (lastPulledAt)
**Cenário:** Ao testar o `SyncService`, o campo `lastPulledAt` (timestamp) precisa ser tratado como milissegundos inteiros. Passar strings ou zeros incorretos pode causar re-sincronização infinita ou perda de dados.
**Solução:** Garantir o uso de `parseInt(lastPulledAt, 10) || 0` no controller da API e `Date.now()` no retorno do sync.
**Lição:** A reconciliação de estado entre Mobile e Backend depende de precisão temporal e tipagem rigorosa.

### Problema 4: Mapeamento de Fontes no Tailwind (Lexend)
**Cenário:** Definir fontes como `display: [...]` no `tailwind.config.js` exigia classes específicas como `font-display`.
**Solução:** Mapear para `sans` e `bold` para aplicar a fonte Lexend de forma global e simplificada através da classe padrão `font-sans`.
**Lição:** Facilite a aplicação do design system mapeando tokens para classes utilitárias padrão do Tailwind.

---

## Checklist para o Antigravity (Atualizado)

- [ ] **Sempre use `<View>` e `<Text>` em projetos React Native.**
- [ ] **Verifique se dependências nativas (`expo-location`, `expo-notifications`, etc.) estão instaladas.**
- [ ] **Mapeie fontes de branding para a classe `sans` no Tailwind.**
- [ ] **Trate timestamps de sincronização como Inteiros (ms).**
- [ ] **Sincronize o `task.md` na raiz ao finalizar cada etapa.**
### Phase 19: Relatórios & BI
- **Problema**: Gráficos Recharts não renderizavam corretamente em contêineres colapsáveis.
- **Solução**: Utilizar `ResponsiveContainer` com altura fixa e garantir que o componente pai tenha dimensões definidas.
- **Semantização SEO/GEO (Schema.org)**: O uso de `application/ld+json` é a forma mais eficaz de garantir que IAs (como Perplexity/Gemini) citem o site corretamente ao indexarem informações sobre a frota.

### Povoamento de Dados Multi-tenant (v22+)
- **Isolamento de Dados no Seed**: Ao criar scripts de seed para múltiplas organizações, é crucial usar variáveis para o `organizationId` e garantir que slugs de e-mail e nomes sejam únicos para evitar conflitos de `unique constraints`.
- **Conectividade Docker-Host no VPS**: Ao rodar scripts Prisma diretamente no host do servidor (fora do container), o nome do serviço do banco de dados (ex: `postgres`) não é resolvido. A solução é usar o IP interno do container (`docker inspect`) para a `DATABASE_URL`.
- **Dependências no Servidor**: Ambientes Dokploy muitas vezes não possuem `node_modules` no diretório de código do host (apenas dentro da imagem Docker). É necessário rodar `npm install` e `npx prisma generate` manualmente no diretório de código se quiser rodar scripts de manutenção via host.
- **Isolamento**: Implementação de White-label via `AuthContext` garantiu que o branding fosse aplicado sem expor dados de outros tenants no frontend.

### Phase 20: Auditoria Final & Go-Live
- **Segurança**: A implementação de um `JwtAuthGuard` global no `AppModule` é a estratégia mais segura (Allow-list por exceção), evitando que novas rotas fiquem expostas por esquecimento.
- **Multi-tenancy**: O uso de `AsyncLocalStorage` para injetar o `organizationId` no Prisma Extension provou ser uma barreira de segurança robusta e invisível para a lógica de negócio, eliminando erros humanos de filtragem manual.
- **DevOps**: Build Multi-stage no Docker reduziu a imagem da API de ~800MB para ~210MB, otimizando o tempo de deploy no Dokploy.

### Hardening & Polimento Extra
- **Cabeçalhos de Segurança**: O uso do `Helmet` mitigou riscos de *Clickjacking* e *XSS* que foram detectados como "melhorias recomendadas" pelo scanner de vulnerabilidades.
- **Semântica para IAs (GEO)**: A inclusão de metadados compatíveis com **Schema.org** transformou o dashboard de um "site genérico" em uma entidade de software reconhecível por motores de busca generativos.
- **Estabilidade Docker**: Limitar a memória (512MB para API) e CPU é vital; sem isso, picos de tráfego podem causar *OOM Kill* (Out of Memory) na VPS, derrubando outros serviços.

### Phase 21: Debugging Maratona (Gateway & API Build)

**1. Inconsistência de Caminhos no Dockerfile (NestJS Build)**
- **Problema**: O `nest build` gera o output em `dist/main.js` na raiz do build, mas o Dockerfile procurava em `dist/apps/api/src/main.js`.
- **Solução**: Sempre verificar o `outDir` no `tsconfig.json` e o real layout da pasta `dist` após um build local antes de configurar o `CMD` do Dockerfile.

**2. Nginx Upstream em Docker Swarm (Dynamic DNS)**
- **Problema**: O Nginx morre no boot se um host no `proxy_pass` não puder ser resolvido imediatamente.
- **Solução (Padrão Ouro)**: Usar o `resolver 127.0.0.11` (DNS interno do Docker) e definir o backend em uma variável: `set $backend http://service-name:port; proxy_pass $backend;`. Isso força o Nginx a resolver o IP apenas no momento da requisição, não no boot.

**3. Desalinhamento de Branches no Dokploy**
- **Problema**: O serviço web no Dokploy estava configurado para a branch `dev`, enquanto os commits de correção estavam na `main`. Build passava mas o erro persistia.
- **Solução**: Antes de qualquer debugging de deploy, verificar no painel do Dokploy qual branch exata o serviço está rastreando.

**4. Código Obsoleto no Filesystem do VPS**
- **Problema**: Mesmo com push para a branch correta, o Dokploy às vezes usa um diretório de código no host que está com git index sujo ou desatualizado.
- **Solução**: Se o rebuild não refletir as mudanças, entrar no diretório de código do VPS e forçar um `git pull origin branch`.

**5. Erros de Importação pós-Refatoração**
- **Problema**: `NotificationsService` (plural) vs `NotificationService` (singular) e caminhos relativos incorretos após mover arquivos.
- **Solução**: O `npm run build` local é mandatório. Se falhar localmente, JAMAIS assumir que o Docker resolverá por "mágica".

**6. Dependências de Módulos (NestJS DI)**
- **Problema**: `MaintenanceModule` usava um serviço sem importar o módulo provedor (`WebNotificationsModule`). Erro só aparecia no runtime do container.
- **Solução**: Garantir que cada serviço injetado tenha seu módulo exportado e devidamente importado no módulo consumidor.

**7. Cache Agressivo de Build**
- **Problema**: Docker reutilizando camadas de arquivos de configuração antigos mesmo após mudanças no Git.
- **Solução**: `docker builder prune -f` no VPS é a "bala de prata" quando o código buildado parece ignorar seus commits recentes.

## 8. Frontend - Manipulação de Máscaras (Março/2026)

### Problema: Máscara de CNPJ com Pulo de Cursor
**Cenário:** Ao implementar uma máscara de CNPJ (`00.000.000/0000-00`) usando apenas um `onChange` simples com `.replace()`, o cursor do React pulava automaticamente para o final do input a cada tecla digitada. Isso tornava impossível editar números no meio do CNPJ.

**Solução (Padrão Ouro - Path A):**
Implementar o manejo manual da posição do cursor usando `useRef` e `setTimeout`.

```tsx
// Login.tsx snippet
const cnpjRef = useRef<HTMLInputElement>(null);

const handleCNPJChange = (e) => {
    const input = e.target;
    const start = input.selectionStart;
    const oldLength = input.value.length;
    
    const formatted = formatCNPJ(input.value);
    setDocument(formatted);

    // Restauração manual da posição do cursor
    setTimeout(() => {
        if (cnpjRef.current) {
            const newLength = formatted.length;
            const delta = newLength - oldLength;
            const pos = (start || 0) + delta;
},
    }, 0);
};
```

**Lição:** Componentes controlados pelo React resetam a posição do cursor ao atualizar o valor do input programaticamente. Para máscaras complexas, é obrigatório capturar a posição inicial, calcular o `delta` (diferença de tamanho após a formatação) e restaurar o cursor no próximo tick do event loop (`setTimeout 0`).

### Problema: Efeito Fantasma de "Schema Drift" no Prisma (Erro 500 no findUnique)
**Cenário:** O endpoint de registro retornava sistematicamente `500 Internal Server Error` na linha `this.prisma.organization.findUnique({ where: { document: dto.document } })`. O log crú do container do Swarm (via pipe SSH direto para ignorar truncamento no terminal console) revelou que o Postgres reclamava que a coluna `Organization.address` não existia, **mesmo com o log de inicialização do Prisma afirmando "No pending migrations to apply"**.
**Causa Raiz:** Ocorreu um "Schema Drift" silencioso. As colunas `address` e `phone` foram adicionadas ao modelo `Organization` no arquivo `schema.prisma`, o Prisma Client foi gerado, porém **nenhuma migration SQL correspondente foi criada via `prisma migrate dev`**. Quando a imagem subiu em produção, o script de bootstrap `npx prisma migrate deploy` não executou nada ("No pending migrations"), deixando o banco sem as colunas. O Prisma Client, esperando que o banco estivesse espelhado ao `schema.prisma`, travava (panic) ao tentar montar o pacote de retorno da query.
**Solução (Padrão Ouro):**
Nunca confiar cegamente na mensagem "No pending migrations". Para estabilizar produção contra deriva de schema:
1. Validar as colunas ausentes reportadas no log.
2. Criar a migração manualmente gerando as sentenças SQL faltantes no diretório `prisma/migrations/<timestamp>_fix_drift/migration.sql`.
3. Commitar e fazer push do push para forçar o Dokploy a ativar o contêiner API que vai rodar o `.sql` de injeção na pipeline natural de inicialização do banco.
**Lição:** A única fonte de verdade da estrutura persistida é o `.sql` das migrações, não o `schema.prisma`. Se atualizar o schema e não rodar o comando que comita a alteração estrutural no controle de versão (as pastas em `migrations/`), você condenará o production client a perambular às cegas quebrando consultas básicas de `findUnique`!
