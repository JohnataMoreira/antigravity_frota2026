# 🗺️ ROADMAP DE DESENVOLVIMENTO - MVP FROTA2026

**Data:** 13 de Fevereiro de 2026
**Autor:** Manus AI
**Para:** Antigravity (Agente de Desenvolvimento)
**Prazo:** Final da próxima semana (21 de Fevereiro de 2026)

---

## 🎯 OBJETIVO DO MVP

O objetivo é ter um produto **funcional e testável** que cubra o fluxo principal do sistema: a **jornada do motorista**.

**Critérios de Sucesso do MVP:**
-   Um motorista consegue iniciar uma jornada, realizar um checklist fotográfico e encerrar a jornada.
-   Um administrador consegue visualizar os dados dessa jornada (incluindo fotos) no painel web.
-   O sistema é multi-tenant, mas o MVP focará em uma única empresa para validação.

---

## 🗓️ CRONOGRAMA GERAL (7 DIAS)

| Dia | Data | Foco Principal | Entregáveis Chave |
|---|---|---|---|
| **1** | Sex, 14/02 | **Backend - Core da Jornada** | - Endpoints para iniciar/encerrar jornada.
| | | | - Lógica de validação de jornada única. |
| **2** | Seg, 17/02 | **Backend - Checklist e Upload** | - Endpoints para submeter checklist.
| | | | - Upload de fotos para o Minio. |
| **3** | Ter, 18/02 | **Mobile - Fluxo da Jornada** | - Telas de login, seleção de veículo.
| | | | - Fluxo completo de jornada no app. |
| **4** | Qua, 19/02 | **Mobile - Checklist Fotográfico** | - Integração da câmera.
| | | | - Envio do checklist com fotos. |
| **5** | Qui, 20/02 | **Frontend Web - Visualização** | - Dashboard com jornadas recentes.
| | | | - Detalhes da jornada com fotos. |
| **6** | Sex, 21/02 | **Testes e Polimento** | - Testes E2E do fluxo principal.
| | | | - Correção de bugs e ajustes de UI. |
| **7** | Sáb, 22/02 | **Buffer e Deploy Final** | - Tempo extra para imprevistos.
| | | | - Deploy da versão MVP. |

---

## 🗺️ ROADMAP DETALHADO POR FASES

### **FASE 1: Backend Core (2 dias)**

**Objetivo:** Criar a espinha dorsal da lógica de negócio no NestJS.

| Tarefa | Prioridade | Complexidade | Detalhes |
|---|---|---|---|
| **1.1. Módulo de Autenticação** | 🔴 Crítica | Média | - JWT para motoristas e admins.
| | | | - Endpoints `/auth/login` e `/auth/me`. |
| **1.2. CRUD de Veículos** | 🟠 Alta | Baixa | - Endpoints para listar, criar, ver, atualizar veículos. |
| **1.3. Módulo de Jornadas** | 🔴 Crítica | Alta | - `POST /jornadas/start`: Inicia jornada, valida km, atualiza status do veículo.
| | | | - `POST /jornadas/end`: Encerra jornada, atualiza km final. |
| **1.4. Módulo de Checklists** | 🟠 Alta | Média | - `POST /checklists`: Recebe dados do checklist e fotos.
| | | | - Associa checklist à jornada correta. |
| **1.5. Upload para Minio** | 🟠 Alta | Média | - Serviço para fazer upload de arquivos para o bucket do Minio.
| | | | - Retorna a URL do arquivo. |

### **FASE 2: Mobile App (2 dias)**

**Objetivo:** Criar a experiência do motorista no React Native.

| Tarefa | Prioridade | Complexidade | Detalhes |
|---|---|---|---|
| **2.1. Telas de Autenticação** | 🔴 Crítica | Baixa | - Tela de login que consome a API do backend. |
| **2.2. Seleção de Veículo** | 🔴 Crítica | Baixa | - Lista de veículos disponíveis. |
| **2.3. Fluxo de Jornada** | 🔴 Crítica | Média | - Botões para "Iniciar Jornada" e "Encerrar Jornada".
| | | | - Exibe status da jornada atual. |
| **2.4. Tela de Checklist** | 🔴 Crítica | Alta | - Formulário com os itens do checklist.
| | | | - Botão para tirar foto para cada item. |
| **2.5. Integração da Câmera** | 🟠 Alta | Média | - Usar a API nativa para abrir a câmera e capturar imagem. |

### **FASE 3: Frontend Web (1 dia)**

**Objetivo:** Criar a visão do administrador no Next.js.

| Tarefa | Prioridade | Complexidade | Detalhes |
|---|---|---|---|
| **3.1. Dashboard de Jornadas** | 🔴 Crítica | Média | - Tabela com as últimas jornadas (motorista, veículo, data, status). |
| **3.2. Detalhes da Jornada** | 🔴 Crítica | Média | - Página que mostra todos os dados de uma jornada.
| | | | - Exibe as fotos do checklist. |

### **FASE 4: Finalização (1-2 dias)**

**Objetivo:** Garantir que tudo funciona de ponta a ponta.

| Tarefa | Prioridade | Complexidade | Detalhes |
|---|---|---|---|
| **4.1. Teste E2E** | 🔴 Crítica | Média | - Simular o fluxo completo: login motorista → jornada → checklist → login admin → ver jornada. |
| **4.2. Correção de Bugs** | 🟠 Alta | Variável | - Corrigir problemas encontrados nos testes. |
| **4.3. Deploy do MVP** | 🔴 Crítica | Baixa | - Abrir o PR final para a `main`. |

---

## 🚀 DIRETRIZES

-   **Foco no Essencial:** Ignore funcionalidades não críticas para o MVP (ex: relatórios complexos, geolocalização em tempo real, manutenções).
-   **Commits Diários:** Faça push para a branch `dev` no final de cada dia.
-   **Comunicação:** Se prever atrasos, abra uma issue no GitHub e me marque para realinharmos o plano.

**Este cronograma é agressivo, mas factível. Foco total no fluxo da jornada. Vamos entregar este MVP na próxima semana!** 🚀
