# CHANGELOG - Frota2026

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.1.3] - 2026-02-14
### 🚀 Adicionado
- **Sistema de Auditoria Profissional:** Captura automática de estados `antes` e `depois` (Diff) em mutações.
- **Auditoria de Autenticação:** Registro explícito de eventos de `LOGIN` e criação de organização.
- **Admin Audit API:** Endpoint `GET /api/audit` para consulta de logs com filtros e paginação.
- **Intercapetor de Auditoria Inteligente:** Mapeamento automático de entidades e sanitização de dados sensíveis.

## [2.1.2] - 2026-02-14
### 🚀 Adicionado
- **Blindagem Técnica (Manutenção & Incidentes):** Refatoração completa para tipagem estrita e Swagger.
- **DTOs de Manutenção:** `CreateMaintenanceDto` e `CompleteMaintenanceDto` com validações rigorosas.
- **Transações Tipadas:** Remoção de `any` e `as any` nos serviços de manutenção e incidentes.

## [2.1.1] - 2026-02-14
### 🚀 Adicionado
- **Expansão Swagger:** Documentação completa aplicada aos controladores `Fuel`, `Journeys`, `Maintenance` e `Reports`.
- **Tipagem Estrita (Fuel):** Introdução de `CreateFuelDto` e eliminação de tipos `any`.
- **UserRequest Interface:** Padronização do acesso ao contexto do usuário em todos os controladores afetados.

### 🛠️ Corrigido
- **Type Mismatch (Prisma):** Harmonização entre DTOs de entrada e enums nativos do banco de dados.

## [2.1.0] - 2026-02-14
### 🚀 Adicionado (Excelência Técnica)
- **Infraestrutura de Validação Monorepo:** Adicionado scripts `validate` e `type-check` globais para garantir a "Regra de Ouro".
- **Documentação Swagger/OpenAPI:** Implementado em `/api/docs` para transparência técnica total.
- **Support Multi-Tenancy (Fix):** Harmonização das chaves do payload JWT (`orgId` e `organizationId`).
- **Scripts de Backup:** Criado `scripts/backup-db.sh` para automação de segurança de dados.

### 🛠️ Corrigido
- **LiveMap Runtime Error:** Resolvido erro `n is not a function` através de refatoração defensiva do Leaflet.
- **Internal Server Error (Creation):** Corrigido bug que impedia a criação de Funcionários e Veículos devido à falta de contexto de organização no prisma.
- **Lint Standardization:** Unificação das regras de ESLint para evitar falsos positivos em variáveis não utilizadas com prefixo `_`.

### 🔒 Segurança
- **Rate Limiting:** Implementado limite de 5 req/min na rota de login.
- **CORS Restritivo:** API configurada para aceitar apenas domínios autorizados.

## [2.0.0] - 2026-02-13
### 🚀 Adicionado
- **Branding Grupo Paraopeba:** Integração de logo e identidade visual.
- **Dashboard Metrics:** Implementação completa de KPIs de custos e frota.
- **Gerenciamento de Manutenções:** CRUD completo e catálogo de reparos.

## [1.0.0] - Pre-2026-02-13
- **Base do Sistema:** Autenticação, Multi-tenancy inicial, CRUD básico de usuários e veículos.
