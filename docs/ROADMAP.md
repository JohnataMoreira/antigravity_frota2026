# Task Checklist - Fleet Management (v2.7)

## [x] Otimização de Rotas e Monitoramento de Desvios (v2.7)
- [x] Pesquisa e definição de provedor de roteamento (OSRM, Google, Mapbox)
- [x] Extensão do Schema Prisma (Modelo de Rotas Planejadas e Geofences)
- [x] Implementação de lógica de monitoramento de desvios no backend
- [x] Interface de criação de rotas (Desenho no mapa)
- [x] Dashboard de eficiência (Real x Planejado)

## [x] Integração com Telemetria OBD2 (v2.6)
- [x] Criação do modelo `TelemetryRecord` no Prisma
- [x] Implementação do endpoint de ingestão de dados
- [x] Integração com `LocationsGateway` (WebSocket)
- [x] Atualização automática de KM e Combustível no Veículo
- [x] Indicadores de status real-time no Dashboard/Mapa
- [x] Hotfix v2.6.1: Resiliência de dados e correção do LiveMap

## [x] Módulo de Jornadas (v2.3)
- [x] Correção de importação em `JourneyDetails.tsx`
- [x] Visualização de rota no mapa (Leaflet)
- [x] Alerta visual para jornadas longas (>12h)
- [x] Exibição detalhada de checklist (todos os itens)
- [x] Cálculo e exibição de duração estimada

## [x] Módulo de Manutenção Preventiva (v2.4)
- [x] Extensão do Prisma Schema (`intervalKm`, `description`)
- [x] Migração e Geração do Client
- [x] Implementação de `checkAlerts` dinâmico no backend
- [x] Atualização da interface de Catálogo de Serviços
- [x] Dashboard de Saúde da Frota
    - [x] Dashboard de Alertas na página de Manutenção
    - [x] Componente `VehicleHealthCard` para o Home
- [x] Testes de validação (KM vs Planilha)
- [x] Documentação Final (Walkthrough)

## [x] Módulo de Inventário e Estoque (v2.5)
- [x] Criação dos modelos Prisma (`InventoryItem`, `StockMovement`)
- [x] Implementação do Backend (Service/Controller)
- [x] Criação da interface de Catálogo de Peças
- [x] Sistema de alertas de estoque baixo na UI
- [x] Registro manual de entradas e saídas
## [x] Gestão de Incidentes em Tempo Real (v2.8)
- [x] Atualização do Schema Prisma (Campo Location em Incident)
- [x] Ingestão de Latitude/Longitude no POST de Incidentes
- [x] Notificações Push/WebSocket em tempo real para Admin
- [x] Marcadores de Incidentes no LiveMap
- [x] Atualização dinâmica do AlertsWidget (Dashboard)

## [x] Scorecard de Motoristas e Ranking (v2.9)
- [x] Implementação da lógica de Score (Segurança, Eficiência, Conformidade)
- [x] Atualização do endpoint `getDriverRanking`
- [x] Interface de Ranking Detalhado no Dashboard
- [x] Indicadores visuais de performance (Sinaleiros)

## [ ] Estabilidade e Hardening (v3.0)
- [ ] Load Testing (WebSocket/API)
- [ ] Security Audit (npm audit, JWT review)
- [ ] Database Optimization (Indices, Caching)
- [ ] Auto-Backups (S3/MinIO)
- [ ] UX Polishing (Error boundaries, Skeletons)
- [ ] 🚨 CORREÇÃO CRÍTICA (Logo + Login)
    - [x] Fix Logo path in Login.tsx
    - [x] Fix Vite Proxy / Axios BaseURL
    - [x] Create Admin Recovery Script
    - [x] Sync & Deploy to Prod
