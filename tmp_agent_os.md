# ðŸš€ AGENT_OS â€” Frota2026

**Versão:** 3.4.0  
**Data:** 06 de Março de 2026  
**Projeto:** Frota2026 â€” Sistema SaaS de GestÃ£o de Frotas Multi-Empresa  
**RepositÃ³rio:** https://github.com/JohnataMoreira/antigravity_frota2026  
**ProduÃ§Ã£o:** https://frota.johnatamoreira.com.br  
**Servidor:** root@159.69.198.77 (Hetzner VPS â€” Dokploy + Traefik)

---

## ðŸ“– ÃNDICE

1. [MissÃ£o e PrincÃ­pios](#1-missÃ£o-e-princÃ­pios)
2. [O Produto â€” Contexto de NegÃ³cio](#2-o-produto--contexto-de-negÃ³cio)
3. [Estado Real do Projeto](#3-estado-real-do-projeto)
4. [Bugs e InconsistÃªncias Confirmadas](#4-bugs-e-inconsistÃªncias-confirmadas)
5. [Plano de AÃ§Ã£o â€” Web (Prioridade Atual)](#5-plano-de-aÃ§Ã£o--web-prioridade-atual)
6. [Regras de NegÃ³cio â€” NÃƒO VIOLÃVEIS](#6-regras-de-negÃ³cio--nÃ£o-violÃ¡veis)
7. [Stack e Arquitetura](#7-stack-e-arquitetura)
8. [PadrÃµes TÃ©cnicos ObrigatÃ³rios](#8-padrÃµes-tÃ©cnicos-obrigatÃ³rios)
9. [Protocolo PrÃ©-Commit â€” OBRIGATÃ“RIO](#9-protocolo-prÃ©-commit--obrigatÃ³rio)
10. [Docker e Infraestrutura](#10-docker-e-infraestrutura)
11. [Workflow Git](#11-workflow-git)
12. [Deploy e ProduÃ§Ã£o](#12-deploy-e-produÃ§Ã£o)
13. [Troubleshooting](#13-troubleshooting)

---

## LEITURA OBRIGATORIA - Lessons Learned

> Antes de iniciar qualquer tarefa, leia `.agent/LESSONS_LEARNED.md`.
> Este arquivo contem padroes de erro reais detectados em revisoes de codigo.
> Ignora-lo causa retrabalho e regressoes ja conhecidas.

---

## 1. MissÃ£o e PrincÃ­pios

VocÃª Ã© um **agente autÃ´nomo de desenvolvimento** responsÃ¡vel por finalizar e manter o **Frota2026** â€” um sistema SaaS completo de gestÃ£o de frotas multi-empresa.

### PrincÃ­pios InegociÃ¡veis

- **ExcelÃªncia sem atalhos.** Nenhuma gambiarra. Se a soluÃ§Ã£o correta Ã© mais difÃ­cil, Ã© a que serÃ¡ implementada.
- **Qualidade de produÃ§Ã£o.** Cada entrega deve funcionar em produÃ§Ã£o. Sem "funciona na minha mÃ¡quina".
- **Testar antes de commitar.** Sem exceÃ§Ãµes. Ver [SeÃ§Ã£o 9](#9-protocolo-prÃ©-commit--obrigatÃ³rio).
- **CÃ³digo limpo e tipado.** TypeScript strict. Zero `any` sem justificativa documentada.
- **Um problema de cada vez.** Resolver completamente antes de avanÃ§ar.

### Foco Atual

> **O web estÃ¡ em ~90%. O objetivo Ã© finalizar o web antes de qualquer trabalho no app mobile.**
>
> Siga rigorosamente o [Plano de AÃ§Ã£o â€” SeÃ§Ã£o 5](#5-plano-de-aÃ§Ã£o--web-prioridade-atual).

---

### âš ï¸ Protocolo CÃ©tico â€” Comportamento ObrigatÃ³rio do Agente

**Este protocolo existe por um motivo concreto.** Na execuÃ§Ã£o da Fase 1, o commit `ba0d132` foi reportado como "concluÃ­do" quando na realidade:
- Apenas `notification.service.ts` foi corrigido â€” `reports.service.ts` recebeu `@ts-ignore` para mascarar os erros em vez de corrigi-los
- 4 ocorrÃªncias de "Grupo Paraopeba" permaneceram em `exportService.ts` e `reports-cron.service.ts`
- O `type-check` passava â€” porque os erros foram suprimidos, nÃ£o resolvidos

**Regra fundamental:** O build passando nÃ£o Ã© prova de que a tarefa estÃ¡ concluÃ­da. Ã‰ condiÃ§Ã£o mÃ­nima, nÃ£o condiÃ§Ã£o suficiente.

#### Antes de reportar qualquer tarefa como concluÃ­da, execute e mostre o output de:

**Ao remover texto, branding ou referÃªncias:**
```powershell
# Confirmar ausÃªncia â€” o resultado DEVE ser vazio
Select-String -Recurse -Path apps/web/src,apps/api/src -Include *.ts,*.tsx -Pattern "texto_removido"
```

**Ao corrigir TypeScript:**
```bash
npm run type-check 2>&1
# DEVE terminar com exit code 0
# DEVE ser verificado que nenhum @ts-ignore foi adicionado como atalho
```

**Ao implementar funcionalidade:**
- A rota estÃ¡ registrada no `App.tsx`?
- O endpoint existe na API e responde via Swagger?
- O componente renderiza sem erros de console?
- O estado de loading e o estado vazio estÃ£o tratados?

**Ao modificar o schema Prisma:**
```bash
npx prisma migrate dev --name descricao   # migration criada?
npx prisma generate                        # client regenerado?
npm run build                              # API compila apÃ³s o generate?
```

#### PadrÃµes de falso positivo â€” nunca reportar como "concluÃ­do" nestas situaÃ§Ãµes

| SituaÃ§Ã£o | O que deve ser feito |
|----------|----------------------|
| Build passa com `@ts-ignore` adicionado | Corrigir o tipo real. `@ts-ignore` Ã© supressÃ£o, nÃ£o soluÃ§Ã£o. |
| Removeu uma ocorrÃªncia, nÃ£o buscou outras | Sempre buscar globalmente antes de declarar ausÃªncia. |
| Componente criado mas nÃ£o roteado | Sem rota, a feature nÃ£o existe para o usuÃ¡rio. |
| Endpoint criado mas nÃ£o testado | Testar com curl ou Swagger antes de commitar. |
| "Funciona localmente" sem verificar produÃ§Ã£o | Checar logs de produÃ§Ã£o apÃ³s deploy. |

#### Tom dos relatÃ³rios

Reportar o que foi feito, o que foi verificado, e o que ficou pendente â€” mesmo que seja algo pequeno. **RelatÃ³rio honesto Ã© mais valioso do que relatÃ³rio otimista.**

Exemplo de relatÃ³rio correto:
```
âœ… Corrigido: notification.service.ts â€” erro de 'unknown' no catch block
âœ… Verificado: type-check com exit code 0, confirmado sem @ts-ignore
âš ï¸ Pendente: reports.service.ts â€” os @ts-ignore ainda existem, tarefa incompleta
âš ï¸ Pendente: exportService.ts linha 17 â€” ainda referencia "GRUPO PARAOPEBA"
```

---

## 2. O Produto â€” Contexto de NegÃ³cio

### Origem Real do Projeto

O Frota2026 nasceu de uma necessidade concreta: o **Grupo Paraopeba** â€” empresa de transporte â€” precisava digitalizar o controle da sua frota. O desenvolvimento comeÃ§ou como um produto customizado para eles.

Durante o processo, o potencial SaaS ficou evidente. A decisÃ£o foi manter a arquitetura multi-tenant desde o inÃ­cio â€” o que jÃ¡ foi feito corretamente (todo o banco usa `organizationId`). O Grupo Paraopeba serÃ¡ o **primeiro cliente e o ambiente de validaÃ§Ã£o real** do produto.

### EstratÃ©gia de Entrega â€” Dois Momentos Distintos

**Momento 1 â€” Produto Paraopeba (agora):**
Entregar o sistema funcional com a identidade visual do Grupo Paraopeba. Eles testam, validam, apontam ajustes. O produto prova seu valor em condiÃ§Ãµes reais de operaÃ§Ã£o.

**Momento 2 â€” SaaS (apÃ³s validaÃ§Ã£o):**
Com o produto validado, abrir para novos clientes. Cada empresa cria sua organizaÃ§Ã£o, sobe sua logo, define suas cores. O Paraopeba continua como cliente normal â€” apenas com sua prÃ³pria marca configurada.

> **DecisÃ£o tÃ©cnica tomada:** NÃ£o haverÃ¡ dois deployments separados, nem dois repositÃ³rios. Um Ãºnico sistema, com white-label por tenant. Dois deployments seria gambiarra â€” duplicaria infraestrutura, dividiria manutenÃ§Ã£o para sempre e criaria divergÃªncias de cÃ³digo inevitÃ¡veis.

### O Que Isso Significa na PrÃ¡tica

O modelo `Organization` precisa de campos de branding que hoje **nÃ£o existem**:

```prisma
// Estado atual â€” apenas:
model Organization {
  id        String   @id @default(uuid())
  name      String
  document  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  ...
}

// Estado necessÃ¡rio â€” adicionar via migration:
model Organization {
  id           String   @id @default(uuid())
  name         String
  document     String   @unique
  logoUrl      String?  // URL da logo (MinIO)
  primaryColor String?  @default("#2563eb") // Cor primÃ¡ria da marca
  faviconUrl   String?  // Favicon personalizado (opcional)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  ...
}
```

A tela de Settings > Perfil da OrganizaÃ§Ã£o (Bug #1) Ã© onde o admin do Paraopeba vai carregar a logo deles e definir a cor. Quando o SaaS abrir, todo novo cliente faz o mesmo. O `DashboardLayout` jÃ¡ foi corrigido para ler `user?.organization?.logoUrl` dinamicamente â€” a base estÃ¡ pronta.

A **migration dos campos de branding Ã© parte da Tarefa 2.1** (Settings funcional). NÃ£o Ã© trabalho extra â€” Ã© a mesma tarefa, feita completa.

### O Que o Grupo Paraopeba VerÃ¡

Quando o admin deles fizer login apÃ³s a configuraÃ§Ã£o:
- Logo deles no header e no login
- Nome da empresa em todos os e-mails e PDFs exportados
- Cor primÃ¡ria aplicada no tema da interface

Quando um futuro cliente SaaS fizer login: sua prÃ³pria marca. Nenhum cÃ³digo diferente â€” sÃ³ dados diferentes no banco.

### O Problema Real que o Produto Resolve

Empresas de transporte e gestÃ£o de frotas perdem dinheiro e controle porque:
- Registros ainda sÃ£o feitos em papel ou planilhas desconexas
- NÃ£o hÃ¡ evidÃªncia fotogrÃ¡fica do estado dos veÃ­culos na saÃ­da e chegada
- Custos reais de manutenÃ§Ã£o e combustÃ­vel sÃ£o desconhecidos
- Motoristas nÃ£o tÃªm controle formal de jornada
- DecisÃµes sÃ£o baseadas em "achismo", nÃ£o em dados

### A SoluÃ§Ã£o â€” Frota2026

Um ecossistema com identidade visual configurÃ¡vel por empresa:

- **Painel Web (Admin):** GestÃ£o completa da frota, dashboard com KPIs em tempo real, relatÃ³rios, configuraÃ§Ãµes de branding
- **App Mobile (Motorista):** InÃ­cio/encerramento de jornadas, checklist fotogrÃ¡fico, registro de abastecimento

### Personas

#### Administrador (usa o web)
Gestor responsÃ¡vel pela frota. Precisa de visibilidade total: onde estÃ£o os veÃ­culos, quanto custam, quem os usa e em que estado estÃ£o.

**Fluxo tÃ­pico:**
1. Login â†’ Dashboard (KPIs em tempo real)
2. Visualiza jornadas ativas e veÃ­culos em uso no mapa
3. VÃª alertas reais de manutenÃ§Ã£o preventiva
4. Acessa histÃ³rico fotogrÃ¡fico de um veÃ­culo especÃ­fico
5. Exporta relatÃ³rio de custos do mÃªs com logo da empresa

#### Motorista (usa o app mobile)
FuncionÃ¡rio de campo. Pode ter pouca experiÃªncia com tecnologia. Precisa de processo rÃ¡pido e simples.

**Fluxo tÃ­pico:**
1. Login no app
2. Seleciona veÃ­culo disponÃ­vel (por placa/modelo)
3. Informa km inicial
4. Realiza checklist fotogrÃ¡fico de saÃ­da (fotos de cada parte do veÃ­culo)
5. Durante uso: registra abastecimento e incidentes com foto e localizaÃ§Ã£o
6. Ao retornar: informa km final e realiza checklist de entrada
7. Jornada encerrada

---

## 3. Estado Real do Projeto

### 3.1 API (NestJS + Prisma + PostgreSQL)

**MÃ³dulos implementados (com rotas e lÃ³gica):**
`auth`, `users`, `vehicles`, `journeys`, `checklists`, `fuel`, `maintenance`, `fines`, `finance`, `compliance`, `reports`, `inventory`, `tyres`, `purchasing`, `telemetry`, `locations`, `attachments`, `incidents`, `invites`, `backup`, `sync`, `storage`, `health`

**Status:** Estrutura completa. 3 erros de TypeScript conhecidos (detalhados na SeÃ§Ã£o 4).

**Swagger:** DisponÃ­vel em `/api/docs`

### 3.2 Web (React + Vite + TailwindCSS)

| MÃ³dulo | Rota | Status | ObservaÃ§Ã£o |
|--------|------|--------|------------|
| Login | `/login` | âœ… Funcional | |
| Register via Invite | `/register` | âœ… Funcional | |
| Dashboard | `/dashboard` | âš ï¸ Parcial | Alertas hardcoded â€” ver Bug #2 |
| VeÃ­culos (lista) | `/vehicles` | âœ… Funcional | |
| VeÃ­culo (formulÃ¡rio) | `/vehicles/new` | âœ… Funcional | |
| VeÃ­culo (detalhe) | `/vehicles/:id` | âŒ Ausente | Rota nÃ£o existe â€” Bug #3 |
| FuncionÃ¡rios | `/users` | âœ… Funcional | |
| Jornadas (lista) | `/journeys` | âœ… Funcional | |
| Jornada (detalhe) | `/journeys/:id` | âœ… Funcional | Mapa + fotos |
| Abastecimentos | `/fuel` | âœ… Funcional | |
| ManutenÃ§Ã£o | `/maintenance` | âœ… Funcional | |
| Multas | `/fines` | âœ… Funcional | |
| Compras | `/purchasing` | âœ… Funcional | |
| Estoque | `/inventory` | âœ… Funcional | |
| Pneus | `/tyres` | âœ… Funcional | |
| Financeiro | `/finance` | âœ… Funcional | |
| Conformidade | `/compliance` | âœ… Funcional | |
| RelatÃ³rios | `/reports` | âœ… Funcional | Export PDF/Excel |
| ConfiguraÃ§Ãµes | `/settings` | âŒ Shell vazia | Bug #1 â€” apenas cards decorativos |
| Config. Checklist | (sem rota) | âŒ Ausente | Bug #4 â€” mÃ³dulo nÃ£o existe |

### 3.3 App Mobile (React Native + Expo)

**Status atual:** ~0% â€” estrutura iniciada apenas, sem fluxo funcional completo.

**Arquivos existentes:**
- `app/(tabs)/index.tsx` â€” tela home
- `app/(tabs)/journey.tsx` â€” tela de jornada
- `app/login.tsx` â€” login
- `app/checklist.tsx` â€” checklist
- `app/camera.tsx` â€” cÃ¢mera

> â›” **NÃ£o trabalhe no mobile agora.** O foco Ã© finalizar o web. O mobile serÃ¡ a prÃ³xima fase.

### 3.4 Infra (ProduÃ§Ã£o)

| ServiÃ§o | Container | Tamanho | Status |
|---------|-----------|---------|--------|
| API (NestJS) | `antigravity_frota2026-api-1` | 935MB âš ï¸ | Rodando |
| Web (Nginx) | `antigravity_frota2026-web-1` | 64.7MB | Rodando |
| Banco | `antigravity_frota2026-postgres-1` | â€” | Rodando |
| Storage | `antigravity_frota2026-minio-1` | â€” | Rodando |

> âš ï¸ Imagem da API com 935MB indica build nÃ£o otimizado (node_modules incluÃ­dos). ApÃ³s finalizar o web, otimizar o Dockerfile com multi-stage build.

---

## 4. Bugs e InconsistÃªncias Confirmadas

Esta Ã© a lista exata de problemas encontrados por auditoria completa do cÃ³digo em 05/03/2026. **Resolva todos antes de avanÃ§ar para o mobile.**

---

### Bug #1 â€” Settings sem funcionalidade [CRÃTICO]

**Arquivo:** `apps/web/src/pages/Settings/index.tsx`

**Problema:** A pÃ¡gina exibe 5 cards (Perfil da OrganizaÃ§Ã£o, NotificaÃ§Ãµes, SeguranÃ§a, IntegraÃ§Ãµes & Dados, RegionalizaÃ§Ã£o) mas nenhum deles abre, salva ou faz qualquer coisa. Ã‰ decoraÃ§Ã£o pura. Nenhuma API Ã© chamada.

**Impacto:** O admin nÃ£o consegue configurar nada do sistema. Funcionalidade completamente ausente.

**O que implementar:**
1. **Perfil da OrganizaÃ§Ã£o:** FormulÃ¡rio para editar nome, logo, CNPJ, telefone da organizaÃ§Ã£o. Chama `PATCH /organizations/:id`.
2. **NotificaÃ§Ãµes:** Toggles para ativar/desativar alertas de manutenÃ§Ã£o preventiva (por km), documentos prÃ³ximos ao vencimento (dias), jornadas sem encerramento. Persiste no banco.
3. **SeguranÃ§a:** Listagem dos Ãºltimos 10 acessos (tabela de auditoria), botÃ£o "Encerrar todas as sessÃµes".
4. **RegionalizaÃ§Ã£o:** Select de moeda (BRL padrÃ£o), fuso horÃ¡rio, unidade de km/milha.

> Se a API nÃ£o tiver endpoints para algum desses itens, **criar os endpoints necessÃ¡rios na API antes de implementar o frontend.**

---

### Bug #2 â€” Alertas do Dashboard com dados hardcoded [CRÃTICO]

**Arquivo:** `apps/web/src/pages/DashboardHome.tsx` â€” seÃ§Ã£o "Alertas Recentes"

**Problema:** Os alertas exibem dados fixos no cÃ³digo-fonte:
```tsx
// PROBLEMA: estes dados sÃ£o falsos, sempre os mesmos
<p className="font-medium">VeÃ­culo ABC-1234</p>
<p>ManutenÃ§Ã£o preventiva vence em 3 dias</p>

<p className="font-medium">Motorista JoÃ£o Silva</p>
<p>3 frenagens bruscas detectadas hoje</p>

<p className="font-medium">VeÃ­culo XYZ-5678</p>
<p>Consumo de combustÃ­vel acima da mÃ©dia</p>
```

**Impacto:** O admin vÃª alertas falsos. O sistema parece ter dados reais mas nÃ£o tem. Isso Ã© enganoso e inÃºtil.

**O que implementar:**
1. Verificar se existe endpoint `GET /alerts` ou similar na API. Se nÃ£o existir, criar.
2. O endpoint deve retornar alertas reais:
   - VeÃ­culos com manutenÃ§Ã£o preventiva a vencer (baseado em km atual vs km alvo)
   - Documentos de conformidade vencidos ou a vencer em 30 dias
   - Jornadas ativas hÃ¡ mais de X horas (configurÃ¡vel)
3. Substituir os alertas hardcoded por mapeamento do array de alertas da API.
4. Se nÃ£o houver alertas, exibir estado vazio adequado ("Nenhum alerta no momento âœ…").

---

### Bug #3 â€” PÃ¡gina de detalhe do veÃ­culo inexistente [CRÃTICO]

**Problema:** A rota `/vehicles/:id` nÃ£o existe no `App.tsx`. Ao clicar em um veÃ­culo na lista, nÃ£o hÃ¡ para onde navegar. NÃ£o Ã© possÃ­vel ver o histÃ³rico de jornadas, manutenÃ§Ãµes e fotos de um veÃ­culo especÃ­fico.

**O que implementar:**

1. Criar `apps/web/src/pages/Vehicles/VehicleDetail.tsx`
2. Registrar rota em `App.tsx`: `<Route path="vehicles/:id" element={<VehicleDetail />} />`
3. Na lista de veÃ­culos (`/vehicles/index.tsx`), adicionar link/botÃ£o que navega para `/vehicles/:id`

**ConteÃºdo da pÃ¡gina de detalhe:**
- Header: placa, modelo, ano, tipo, status atual, foto do veÃ­culo
- KPIs: km total rodado, custo total, nÃºmero de jornadas, nÃºmero de manutenÃ§Ãµes
- Tabs:
  - **Jornadas:** Lista das Ãºltimas 20 jornadas (data, motorista, km inicial/final, duraÃ§Ã£o)
  - **ManutenÃ§Ãµes:** HistÃ³rico completo (tipo, data, custo, descriÃ§Ã£o)
  - **Checklists:** Lista com fotos e itens marcados como PROBLEMA
  - **Abastecimentos:** HistÃ³rico com km, litros e custo
  - **Documentos:** Documentos de conformidade vinculados ao veÃ­culo

---

### Bug #4 â€” ConfiguraÃ§Ã£o de Checklist ausente no web [CRÃTICO]

**Problema:** O `agente.md` e os requisitos do produto especificam que o admin deve poder configurar quais itens compÃµem o checklist (ex: pneus, lataria, vidros, Ã³leo, interior). Esse mÃ³dulo nÃ£o existe no web em nenhuma forma â€” sem rota, sem pÃ¡gina, sem menu.

**O que implementar:**

1. Verificar a tabela/modelo de checklist items na API. Deve existir `ChecklistItem` com campos: `id`, `organizationId`, `name`, `description`, `required`, `order`.
2. Se nÃ£o existir endpoint `GET /checklist-items` e `POST/PATCH/DELETE /checklist-items`, criar na API.
3. Criar `apps/web/src/pages/Settings/ChecklistConfig.tsx` (ou como subpÃ¡gina de Settings)
4. Interface: lista dos itens de checklist com drag-and-drop para reordenar, toggle para obrigatÃ³rio/opcional, botÃ£o adicionar novo item, botÃ£o deletar.
5. Adicionar acesso a esta tela a partir do Settings ou do menu lateral.

---

### Bug #5 â€” Branding "Grupo Paraopeba" hardcoded [IMPORTANTE]

**Arquivos afetados:**
- `apps/web/src/layouts/DashboardLayout.tsx` â€” `alt="Grupo Paraopeba"` hardcoded
- `apps/web/src/pages/DashboardHome.tsx` â€” texto "Bem-vindo ao Frota Manager!"
- `apps/api/src/` â€” verificar se hÃ¡ referÃªncias a "Grupo Paraopeba" em seeds ou mensagens

**Problema:** O produto Ã© um SaaS multi-empresa genÃ©rico. NÃ£o pode ter nome de cliente hardcoded.

**O que implementar:**
1. No `DashboardLayout`, a logo deve vir do perfil da organizaÃ§Ã£o logada (`organization.logoUrl`). Fallback: logo padrÃ£o do Frota2026.
2. O `alt` da imagem deve ser o nome da organizaÃ§Ã£o: `{organization.name}`.
3. Auditar todo o codebase por strings "Paraopeba" e substituir.
4. Remover `Paraopeba.png` da raiz do repositÃ³rio ou mover para pasta de assets de desenvolvimento.

---

### Bug #6 â€” Duplicidade Drivers/Users [IMPORTANTE]

**Problema:** Existe `apps/web/src/pages/Drivers/Drivers.tsx` com lÃ³gica de listagem de motoristas, mas esta pÃ¡gina nunca Ã© roteada no `App.tsx`. O menu lateral aponta para `/users` que usa `pages/Users/index.tsx`. HÃ¡ dois arquivos que fazem a mesma coisa.

**O que fazer:**
1. Comparar `pages/Drivers/Drivers.tsx` vs `pages/Users/index.tsx` e verificar se um tem funcionalidade que o outro nÃ£o tem.
2. Consolidar tudo em `pages/Users/index.tsx` (manter a que jÃ¡ estÃ¡ roteada).
3. Deletar `pages/Drivers/Drivers.tsx` apÃ³s consolidaÃ§Ã£o.
4. Garantir que a listagem de usuÃ¡rios tem filtro por role: TODOS / ADMIN / MOTORISTA.

---

### Bug #7 â€” 3 Erros de TypeScript na API [TÃ‰CNICO]

**Arquivo:** `apps/api/src/reports/reports.service.ts`
**Arquivo:** `apps/api/src/common/notifications/notification.service.ts`

**Erros exatos (de `typescript_errors.txt`):**
```
notification.service.ts(31,63): error TS18046: 'error' is of type 'unknown'.
notification.service.ts(31,87): error TS18046: 'error' is of type 'unknown'.
reports.service.ts(236,45): error TS2353: 'photoUrl' does not exist in type 'UserSelect'.
reports.service.ts(289,21): error TS2353: 'organizationId' does not exist in type 'ChecklistWhereInput'.
reports.service.ts(318,34): error TS2339: Property 'photoUrl' does not exist on type User.
```

**Como corrigir:**

`notification.service.ts` linha 31:
```typescript
// ANTES (errado):
} catch (error) {
  console.error(error.message); // error Ã© 'unknown'
}

// DEPOIS (correto):
} catch (error) {
  const err = error as Error;
  console.error(err.message, err.stack);
}
```

`reports.service.ts`:
- Remover `photoUrl` das queries Prisma onde o campo nÃ£o existe no schema atual.
- Para `organizationId` em `ChecklistWhereInput`: usar `journey: { organizationId }` (relaÃ§Ã£o indireta) em vez de campo direto.
- Verificar o schema Prisma atual antes de corrigir para nÃ£o introduzir novos erros.

---

### Bug #8 â€” Imagem Docker da API com 935MB [PERFORMANCE]

**Problema:** A imagem Docker da API estÃ¡ com 935MB porque o `node_modules` de desenvolvimento estÃ¡ incluÃ­do.

**Como corrigir â€” Dockerfile da API (`apps/api/Dockerfile`):**
```dockerfile
# EstÃ¡gio 1: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# EstÃ¡gio 2: ProduÃ§Ã£o (apenas o necessÃ¡rio)
FROM node:22-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main"]
```

**Meta:** Reduzir de 935MB para ~150-200MB.

> âš ï¸ Testar exaustivamente antes de fazer deploy deste Dockerfile. A API deve iniciar, conectar ao banco e responder em `/api/health`.

---

## 5. Plano de Acao - Web (Prioridade Atual)

Execute nesta ordem exata. Nao pule etapas.

---

### STATUS DA FASE 1 - HOMOLOGADA (06/03/2026)

Todos os itens criticos foram implementados, commitados e estao em producao.
Build Docker estavel. API respondendo em https://frota.johnatamoreira.com.br/api/v1/health.

**Commits da Fase 1:**
- c16de74 - feat: fase 1 completa - correcoes criticas pre-teste Paraopeba
- 7fb8c8c - fix(dockerfile): reescrever para tratar apps/api como raiz do build

**Itens homologados:**
- [x] 1.1 Refresh token com fila de requisicoes no interceptor Axios
- [x] 1.2 Pagina Multas funcional (FinesController + FinesList)
- [x] 1.3 Botao Novo Pneu funcional (TyreModal integrado a API)
- [x] 1.4 Botao Novo Lancamento funcional (TransactionModal integrado a API)
- [x] 1.5 Compras: SupplierModal funcional + submit de pedidos correto
- [x] 1.6 Settings conectado ao useAuth() - upload de avatar via MinIO
- [x] 1.7 Dashboard: VehicleHealthCard navega para /vehicles/:id

---

### STATUS DA FASE 2 - HOMOLOGADA (06/03/2026)

Todos os 5 itens implementados, commitados e mesclados em main.
Commit de merge: 22bc629 (dev -> main)

**Itens homologados:**
- [x] 2.1 Dark Mode consistente - cores hardcoded substituidas por variaveis semanticas Tailwind
- [x] 2.2 Padronizacao de icones - lucide-react em todos os modulos
- [x] 2.3 Dashboard BI - KPIs detalhados + LiveMap integrado
- [x] 2.4 Compliance - DocumentUploadModal integrado, invalidacao correta
- [x] 2.5 3 modos de visualizacao - ViewSwitcher (Grid/Lista/Kanban) em Veiculos, Manutencao, Compras, Motoristas

---

### FASE 3 - PROXIMA (aguardando instrucao)

**Objetivo:** Otimizacoes de producao e funcionalidades avancadas.

Tarefas a definir pelo Johnata. Sugestoes baseadas no backlog:

- [ ] 3.1 Reducao de bundle size (chunk de 1.9MB identificado no build - code splitting necessario)
- [ ] 3.2 Testes E2E minimos (login, jornada, relatorio)
- [ ] 3.3 Notificacoes push (service worker)
- [ ] 3.4 App mobile (React Native / Expo)
- [ ] 3.5 White-label completo para novos clientes

**Aguardar instrucao antes de iniciar qualquer item da Fase 3.**
## 6. Regras de NegÃ³cio â€” NÃƒO VIOLÃVEIS

Estas regras protegem a integridade dos dados. Nunca as quebre.

### Jornadas
1. **Uma jornada por vez:** Motorista nÃ£o pode ter mais de 1 jornada `EM_ANDAMENTO` simultaneamente.
2. **Um veÃ­culo por vez:** VeÃ­culo nÃ£o pode estar em 2 jornadas ao mesmo tempo.
3. **Km nÃ£o pode regredir:** `km_final` DEVE ser `>= km_inicial`. Rejeitar com erro 400 se nÃ£o.
4. **TransaÃ§Ã£o atÃ´mica:** Ao encerrar jornada, a atualizaÃ§Ã£o do status da jornada + atualizaÃ§Ã£o do `km_atual` do veÃ­culo + atualizaÃ§Ã£o do status do veÃ­culo devem ocorrer em uma Ãºnica transaÃ§Ã£o Prisma. Falha em qualquer passo reverte tudo.
5. **Checklist obrigatÃ³rio:** NÃ£o pode iniciar jornada sem checklist de saÃ­da. NÃ£o pode encerrar sem checklist de entrada.

### VeÃ­culos
6. **Status bloqueante:** Apenas veÃ­culos com status `AVAILABLE` aparecem para seleÃ§Ã£o pelo motorista. `IN_USE`, `MAINTENANCE`, `CRITICAL_ISSUE` sÃ£o bloqueados.
7. **Foto do item com problema Ã© altamente recomendada, descriÃ§Ã£o Ã© obrigatÃ³ria:** Se item do checklist = PROBLEMA, `description` nÃ£o pode ser vazia.

### Multi-tenancy
8. **Isolamento absoluto:** Todas as queries Prisma DEVEM filtrar por `organizationId` obtido do JWT. Nunca retornar dados de outra organizaÃ§Ã£o.
9. **Super-admin Ã© exceÃ§Ã£o:** Apenas o super-admin pode ver dados cross-organization.

### SeguranÃ§a
10. **Senhas sempre com bcrypt:** `bcrypt.hash(password, 10)`. Nunca texto plano, nunca MD5.
11. **JWT vÃ¡lido em todos os endpoints protegidos:** Usar o guard de autenticaÃ§Ã£o sem exceÃ§Ã£o.
12. **Rate limiting no login:** MÃ¡ximo 5 tentativas por minuto por IP.

---

## 7. Stack e Arquitetura

### Stack Definida (nÃ£o alterar sem decisÃ£o documentada)

| Camada | Tecnologia | VersÃ£o |
|--------|-----------|--------|
| Backend | NestJS | 10.x |
| ORM | Prisma | 5.x |
| Banco | PostgreSQL | 15/16 |
| Storage | MinIO (S3-compatible) | â€” |
| Web Frontend | React + Vite | React 18 |
| EstilizaÃ§Ã£o | TailwindCSS | 3.x |
| Queries | TanStack Query | 5.x |
| HTTP Client | Axios | â€” |
| App Mobile | React Native + Expo | â€” |
| Offline (Mobile) | WatermelonDB | â€” |
| Monorepo | Turborepo | â€” |
| Infra | Docker Compose + Traefik | â€” |
| CI/CD | GitHub Actions (a configurar) | â€” |

### Estrutura de DiretÃ³rios

```
frota2026/
â”œâ”€â”€ .agent/
â”‚   â”œâ”€â”€ AGENT_OS.md          â† Este arquivo (fonte da verdade)
â”‚   â””â”€â”€ ...
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/                 â† NestJS Backend
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ auth/
â”‚   â”‚   â”‚   â”œâ”€â”€ users/
â”‚   â”‚   â”‚   â”œâ”€â”€ vehicles/
â”‚   â”‚   â”‚   â”œâ”€â”€ journeys/
â”‚   â”‚   â”‚   â”œâ”€â”€ fuel/
â”‚   â”‚   â”‚   â”œâ”€â”€ maintenance/
â”‚   â”‚   â”‚   â””â”€â”€ ...
â”‚   â”‚   â””â”€â”€ prisma/
â”‚   â”œâ”€â”€ web/                 â† React Frontend (Admin)
â”‚   â”‚   â””â”€â”€ src/
â”‚   â”‚       â”œâ”€â”€ pages/
â”‚   â”‚       â”œâ”€â”€ components/
â”‚   â”‚       â”œâ”€â”€ services/
â”‚   â”‚       â”œâ”€â”€ hooks/
â”‚   â”‚       â””â”€â”€ layouts/
â”‚   â””â”€â”€ mobile/              â† Expo (Motorista) â€” FASE FUTURA
â”œâ”€â”€ docs/
â”œâ”€â”€ scripts/
â””â”€â”€ [configs raiz]
```

---

## 8. PadrÃµes TÃ©cnicos ObrigatÃ³rios

### TypeScript

**Backend (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true
  }
}
```
> `target: "ES2020"` Ã© OBRIGATÃ“RIO. Prisma nÃ£o funciona com ES5.

**Frontend (tsconfig.json):**
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "strict": true,
    "jsx": "react-jsx"
  }
}
```

**Regra geral:** Zero `any` sem comentÃ¡rio `// justificativa: motivo`. Se estÃ¡ usando `any`, estÃ¡ evitando o problema, nÃ£o resolvendo.

### Prisma

```bash
# Sempre ao modificar schema:
npx prisma migrate dev --name descricao_da_mudanca
npx prisma generate

# Commitar sempre junto:
git add prisma/schema.prisma prisma/migrations/
```

**NUNCA** modificar schema sem criar migration. **NUNCA** rodar `prisma db push` em produÃ§Ã£o.

### React â€” PadrÃµes de Componente

```typescript
// Interface obrigatÃ³ria para props
interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (id: string) => void;
}

// Componente com tipagem
export const VehicleCard: FC<VehicleCardProps> = ({ vehicle, onEdit }) => {
  return (...);
};

// Estados de loading e erro sempre tratados
const { data, isLoading, error } = useQuery({...});

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage message="Falha ao carregar veÃ­culos" />;
```

### Tratamento de Erro (catch blocks)

```typescript
// NUNCA:
} catch (error) {
  console.error(error.message); // error Ã© 'unknown' em strict mode
}

// SEMPRE:
} catch (error) {
  const err = error as Error;
  console.error(err.message, err.stack);
}
```

### Multi-tenancy em todas as queries

```typescript
// NUNCA:
const vehicles = await prisma.vehicle.findMany();

// SEMPRE:
const vehicles = await prisma.vehicle.findMany({
  where: { organizationId: req.user.organizationId }
});
```

### Commits SemÃ¢nticos

```
feat(mÃ³dulo): descriÃ§Ã£o clara do que foi adicionado
fix(mÃ³dulo): descriÃ§Ã£o do bug corrigido
refactor(mÃ³dulo): o que foi refatorado e por quÃª
docs: o que foi documentado
chore: mudanÃ§a de configuraÃ§Ã£o/dependÃªncia
```

Exemplos:
```bash
git commit -m "feat(settings): implementar ediÃ§Ã£o do perfil da organizaÃ§Ã£o"
git commit -m "fix(dashboard): substituir alertas hardcoded por dados reais da API"
git commit -m "fix(api): corrigir erros TypeScript em reports.service e notification.service"
```

---

## 9. Protocolo PrÃ©-Commit â€” OBRIGATÃ“RIO

**Nunca commitar sem executar este checklist. Sem exceÃ§Ãµes.**

```bash
# Backend
cd apps/api
npm run build          # DEVE passar sem erros
npm run type-check     # DEVE passar sem erros TypeScript

# Frontend
cd ../web
npm run build          # DEVE passar sem erros
npm run type-check     # DEVE passar sem erros TypeScript

# Se modificou Prisma
npx prisma migrate dev
npx prisma generate

# SÃ³ entÃ£o commitar
git add .
git commit -m "tipo(mÃ³dulo): descriÃ§Ã£o"
git push origin dev
```

**Script automÃ¡tico disponÃ­vel na raiz:** `./check-before-commit.sh`

### O Que NÃƒO Fazer

âŒ Commitar cÃ³digo que nÃ£o compila  
âŒ Commitar "para testar em produÃ§Ã£o"  
âŒ Fazer push direto na branch `main`  
âŒ Adicionar dependÃªncia sem instalar  
âŒ Deixar console.log de debug no cÃ³digo  
âŒ Usar `any` sem justificativa  
âŒ Commitar `.env` com senhas reais  

---

## 10. Docker e Infraestrutura

### Arquitetura de Containers

| Container | Imagem | Rede |
|-----------|--------|------|
| `dokploy-traefik` | `traefik:v3.6.7` | `dokploy-network` |
| `frota2026-web` | `nginx:alpine` | `dokploy-network`, `frota-network` |
| `frota2026-api` | `node:22-alpine` | `dokploy-network`, `frota-network` |
| `frota2026-postgres` | `postgres:16-alpine` | `frota-network` |
| `frota2026-minio` | `minio/minio` | `frota-network` |

### Labels Traefik â€” PadrÃ£o ObrigatÃ³rio

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=dokploy-network"  # Uma vez por serviÃ§o
  
  # Router da API
  - "traefik.http.routers.frota-api.rule=Host(`frota.johnatamoreira.com.br`) && PathPrefix(`/api`)"
  - "traefik.http.routers.frota-api.entrypoints=websecure"
  - "traefik.http.routers.frota-api.tls.certresolver=letsencrypt"
  - "traefik.http.routers.frota-api.service=frota-api"  # OBRIGATÃ“RIO quando mÃºltiplos routers
  - "traefik.http.services.frota-api.loadbalancer.server.port=3000"
```

**Regra:** SEMPRE especificar `.service` quando o container tem mÃºltiplos routers.

### VariÃ¡veis de Ambiente (ReferÃªncia)

```bash
# API
DATABASE_URL="postgresql://postgres:SENHA@postgres:5432/frota2026"
JWT_SECRET="secret-forte-gerado-com-openssl-rand-base64-32"
STORAGE_ENDPOINT="http://minio:9000"
STORAGE_BUCKET="frota-uploads"
AWS_ACCESS_KEY_ID="minioadmin"
AWS_SECRET_ACCESS_KEY="SENHA_MINIO"
AWS_S3_FORCE_PATH_STYLE="true"

# Web
VITE_API_URL="https://frota.johnatamoreira.com.br/api"
```

---

## 11. Workflow Git

### Branches

```
main     â† ProduÃ§Ã£o (protegida â€” nÃ£o fazer push direto)
â””â”€â”€ dev  â† Desenvolvimento (trabalhar sempre aqui)
```

### Fluxo de Trabalho

```bash
# Sempre comeÃ§ar atualizando
git checkout dev
git pull origin dev

# Desenvolver, testar, verificar
./check-before-commit.sh

# Commitar
git add .
git commit -m "feat(settings): implementar perfil da organizaÃ§Ã£o"
git push origin dev

# Deploy via Dokploy (automÃ¡tico apÃ³s push, ou manual via painel)
```

---

## 12. Deploy e ProduÃ§Ã£o

### Dados de Acesso

**ProduÃ§Ã£o:** https://frota.johnatamoreira.com.br  
**Servidor:** `ssh root@159.69.198.77`  
**Chaves SSH:** `C:\Projetos\Antigravity\infra/`  
**Gerenciador:** Dokploy (painel em `:3000` no servidor)

### Processo de Deploy

```bash
# 1. Acessar servidor
ssh root@159.69.198.77

# 2. Navegar ao projeto
cd /etc/dokploy/applications/[pasta-do-projeto]

# 3. Pull + rebuild
git pull origin dev
docker-compose build
docker-compose up -d

# 4. Verificar
docker ps
docker logs frota2026-api --tail 50
curl -I https://frota.johnatamoreira.com.br/api/health
```

### Checklist PrÃ©-Deploy

- [ ] `npm run build` passou na API
- [ ] `npm run build` passou no Web
- [ ] Sem erros TypeScript
- [ ] Migrations testadas localmente
- [ ] VariÃ¡veis de ambiente configuradas no servidor
- [ ] CHANGELOG.md atualizado

### Rollback

```bash
git revert HEAD
git push origin dev
# Rebuild e redeploy
```

---

## 13. Troubleshooting

### Problemas Conhecidos e SoluÃ§Ãµes

| Erro | Causa | SoluÃ§Ã£o |
|------|-------|---------|
| 502 Bad Gateway | API crashou ou labels Traefik errados | Ver logs da API; verificar `.service` nos labels |
| 500 em endpoint | Bug no cÃ³digo ou schema Prisma desatualizado | Logs da API; verificar se migration foi aplicada |
| Build TypeScript falhou | Erro de tipo; dependÃªncia faltando | Resolver erro localmente; verificar package.json |
| `n is not a function` no mapa | Leaflet com dados nulos/invÃ¡lidos | Defensive check antes de renderizar markers |
| Container em loop de restart | Env var faltando; erro de conexÃ£o com DB | Ver logs; verificar .env do servidor |

### Ver Logs

```bash
docker logs frota2026-api-1 --tail 100 -f
docker logs frota2026-web-1 --tail 100
docker logs dokploy-traefik --tail 50
```

### Comandos Ãšteis

```bash
# Prisma Studio (local)
cd apps/api && npx prisma studio

# Rebuild sem cache
docker-compose build --no-cache

# Reiniciar serviÃ§o especÃ­fico
docker-compose restart api

# Verificar redes Docker
docker network ls
docker network inspect frota-network
```

---

## âœ… Resumo â€” Regras de Ouro

1. **Testar build antes de qualquer commit** â€” sem exceÃ§Ã£o
2. **TypeScript strict** â€” zero `any` nÃ£o justificado
3. **Multi-tenancy em toda query Prisma** â€” sempre filtrar por `organizationId`
4. **Migration para toda mudanÃ§a de schema** â€” nunca `db push` em produÃ§Ã£o
5. **Commits semÃ¢nticos** â€” `feat/fix/refactor(mÃ³dulo): descriÃ§Ã£o`
6. **Nunca commitar `.env`** com senhas reais
7. **Nunca fazer push direto na `main`**
8. **TransaÃ§Ãµes atÃ´micas** para operaÃ§Ãµes crÃ­ticas de jornada
9. **Estados de loading e erro** em todo componente que faz fetch
10. **Documentar decisÃµes** importantes em commits e no CHANGELOG.md

---

**Última atualização:** 06 de Março de 2026  
**Versão:** 3.4.0  
**Elaborado por:** AnÃ¡lise completa do cÃ³digo-fonte + histÃ³rico do projeto


