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

## 6. Autenticação e Segurança (Março/2026)

### Problema 1: Persistência de Tokens JWT (Stateless)
**Cenário:** O endpoint `/auth/logout-all` apenas gravava um log de auditoria, mas não invalidava os tokens JWT nos dispositivos. Como o JWT não mantém estado no servidor, os usuários continuavam acessando o sistema.
**Solução Aplicada:** Implementação do campo `tokenVersion` no modelo `User`. Em cada requisição (`JwtStrategy`), o `tokenVersion` do Payload do JWT é comparado com o `tokenVersion` do banco de dados. O endpoint `logout-all` incrementa essa versão no banco, invalidando retroativamente e imediatamente todos os tokens antigos.
**Lição:** Sessões stateless puras com JWT são perigosas em sistemas críticos (onde a revogação imediata é legalmente exigida). O rastreio de versão da sessão (Token Versioning) no banco resolve o problema sem a necessidade do peso de um Redis.

### Problema 2: Invalidação Grosseira (Falta de check do Campo `active`)
**Cenário:** O guardião `JwtStrategy` apenas decodificava o Token. Ele não testava no banco se a conta continuava ativa (`active: true`), permitindo que ex-funcionários usassem o app até a expiração do token.
**Solução Aplicada:** Incorporação da checagem em banco no validador do Passport-JWT.
**Lição:** "O Guard defende a porta, mas o Strategy deve perguntar a quem pertence a chave". O Payload de uma sessão não responde sobre o status atual do usuário.

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
- **Isolamento**: Implementação de White-label via `AuthContext` garantiu que o branding fosse aplicado sem expor dados de outros tenants no frontend.

### Phase 20: Auditoria Final & Go-Live
- **Segurança**: A implementação de um `JwtAuthGuard` global no `AppModule` é a estratégia mais segura (Allow-list por exceção), evitando que novas rotas fiquem expostas por esquecimento.
- **Multi-tenancy**: O uso de `AsyncLocalStorage` para injetar o `organizationId` no Prisma Extension provou ser uma barreira de segurança robusta e invisível para a lógica de negócio, eliminando erros humanos de filtragem manual.
- **DevOps**: Build Multi-stage no Docker reduziu a imagem da API de ~800MB para ~210MB, otimizando o tempo de deploy no Dokploy.

### Hardening & Polimento Extra
- **Cabeçalhos de Segurança**: O uso do `Helmet` mitigou riscos de *Clickjacking* e *XSS* que foram detectados como "melhorias recomendadas" pelo scanner de vulnerabilidades.
- **Semântica para IAs (GEO)**: A inclusão de metadados compatíveis com **Schema.org** transformou o dashboard de um "site genérico" em uma entidade de software reconhecível por motores de busca generativos.
- **Estabilidade Docker**: Limitar a memória (512MB para API) e CPU é vital; sem isso, picos de tráfego podem causar *OOM Kill* (Out of Memory) na VPS, derrubando outros serviços.
