# Frota2026 — Diretrizes do Agente (Antigravity v2.0)

## 🎯 Seu Papel e Missão

Você é um **agente autônomo de desenvolvimento** responsável por construir do zero um **sistema completo e profissional de gestão de frotas multi-empresa**.

Este não é um MVP — é o **produto completo e funcional**, pronto para uso em produção.

**Princípios fundamentais:**
- Você tem **autonomia total** sobre todas as decisões técnicas
- Este documento define **o problema e os requisitos** — você define **a solução**
- Pense como um **Tech Lead experiente** construindo para escala
- Entregue **qualidade de produção**, não protótipos

---

## 📖 O que é o Frota2026?

### O Problema Real

Empresas de diversos setores enfrentam problemas críticos na gestão de frotas:

❌ **Processos manuais e falhos**
- Registros em papel se perdem
- Checagens visuais não documentadas
- Impossível auditar o que aconteceu

❌ **Falta de visibilidade**
- Desconhecimento sobre geolocalização dos veículos em uso
- Incerteza sobre quilometragem real
- Estado de conservação após cada uso é um mistério

❌ **Custos descontrolados**
- Sem rastreamento de custos de manutenção por veículo
- Abastecimentos não registrados
- Manutenções preventivas esquecidas

❌ **Gestão ineficiente**
- Controle de jornada de trabalho dos funcionários inexistente
- Problemas descobertos tarde demais
- Decisões baseadas em "achismo", não dados

### A Solução (Frota2026)

Um **ecossistema SaaS multi-empresa** que garante:

✅ **Integridade dos ativos**
- Vistorias fotográficas obrigatórias antes e depois de cada uso
- Rastreamento em tempo real de localização
- Histórico completo e auditável de cada veículo

✅ **Controle de custos**
- Registro de todos abastecimentos
- Gestão de manutenções preventivas e corretivas
- Custos por veículo, motorista, período

✅ **Gestão inteligente**
- Controle de jornada de trabalho
- Alertas automáticos de manutenção
- Cadastro completo para diversos tipos (carros, caminhonetes, caminhões, tratores, etc.)

✅ **Visibilidade total**
- Geolocalização de veículos em uso
- Dashboard com KPIs em tempo real
- Relatórios customizáveis

---

## 👥 Personas e Casos de Uso

### 1. Motorista (App Mobile)

**Perfil:** 
Funcionário de campo que utiliza veículos da empresa diariamente. Pode ter pouca experiência com tecnologia.

**Necessidades:**
- Processo **rápido e simples** para iniciar/encerrar jornadas
- Checklist **fotográfico** (visual) sem burocracia
- Registrar problemas com evidência (foto)
- App funcionar mesmo **offline**

**Fluxo típico:**

1. **Login no app mobile**
2. **Selecionar veículo** (busca por placa, tipo de veículo + modelo)
3. **Informar km inicial**
4. **Checklist fotográfico de saída:**
   - Câmera abre automaticamente para cada item
   - Tirar foto de cada parte do veículo
   - Marcar: ✅ OK ou ⚠️ PROBLEMA
   - Se PROBLEMA → campo descrição obrigatório + foto como evidência
5. **Sistema registra geolocalização ao iniciar jornada**
6. **Durante uso:**
   - Registrar abastecimento (geolocalização capturada)
   - Informar incidentes (geolocalização capturada)
7. **Ao retornar:**
   - Informar km final
   - Checklist fotográfico de entrada
   - Sistema valida km_final >= km_inicial
8. **Jornada encerrada**

### 2. Administrador (Painel Web)

**Perfil:**
Gestor da frota, responsável por toda operação e custos.

**Necessidades:**

**Cadastros (CRUD completo):**
- ✅ Funcionários (motoristas e admins)
- ✅ Veículos (carros, caminhonetes, caminhões, tratores, etc.)
- ✅ Manutenções (preventivas e corretivas)
- ✅ Itens de checklist (configuração de quais itens devem ser vistoriados)

**Monitoramento:**
- Dashboard com visão geral (veículos em uso, jornadas ativas, alertas)
- Mapa com geolocalização de veículos em tempo real
- Histórico completo de cada veículo

**Visualização de dados:**
- Fotos dos checklists com problemas reportados
- Custos por veículo, motorista, período
- Jornadas de trabalho dos funcionários

**Configurações:**
- Definir quais itens devem passar por checklist
- Configurar alertas de manutenção preventiva
- Gerenciar empresas (multi-tenant)

**Fluxo típico:**

1. Login no painel web
2. Dashboard mostra:
   - 15 veículos em uso (mapa ao vivo)
   - 3 alertas de manutenção preventiva
   - Custo total do mês até agora
3. Clica em veículo específico → histórico completo
4. Vê que há checklist com problema reportado ontem
5. Abre fotos do problema (amassado no para-choque)
6. Agenda manutenção na oficina
7. Sistema marca veículo como "em manutenção" (não aparece para motoristas)
8. Exporta relatório de custos do trimestre

---

## 🎯 Requisitos Funcionais Completos

### Funcionalidades Obrigatórias

#### 🚗 Gestão de Veículos

- [ ] **Cadastro completo de frota**
  - Suporte para: carros, caminhonetes, caminhões, tratores, máquinas pesadas
  - Dados: placa, marca, modelo, ano, tipo, km atual, status
  - Foto do veículo
  - Histórico completo de uso

- [ ] **Estados do veículo:**
  - `disponível` → Aparece para seleção de motoristas
  - `em uso` → Jornada ativa
  - `em manutenção` → Bloqueado
  - `problema crítico` → Bloqueado

#### 👤 Gestão de Usuários

- [ ] **Cadastro de funcionários (CRUD completo)**
  - Dados: nome, CPF, CNH, email, telefone, foto
  - Perfis: `MOTORISTA` ou `ADMIN`
  - Status: `ativo` ou `inativo`
  - Empresas vinculadas (multi-tenant)

- [ ] **Autenticação e autorização**
  - Login seguro
  - Recuperação de senha
  - Controle de acesso por perfil
  - Sessões seguras

#### 🛣️ Jornadas de Trabalho

- [ ] **Iniciar jornada**
  - Selecionar veículo (apenas disponíveis)
  - Informar km inicial
  - Checklist fotográfico obrigatório (saída)
  - **Captura de geolocalização ao iniciar**
  - Sistema valida: não pode haver jornada ativa do mesmo motorista/veículo

- [ ] **Durante jornada**
  - Registrar abastecimento (com geolocalização)
  - Informar incidentes (com geolocalização)
  - Sistema rastreia geolocalização continuamente (opt-in)

- [ ] **Encerrar jornada**
  - Informar km final (validação: >= km inicial)
  - Checklist fotográfico obrigatório (entrada)
  - **Captura de geolocalização ao encerrar**
  - Sistema atualiza automaticamente:
    - Status da jornada → `finalizada`
    - km_atual do veículo → km_final da jornada
    - Status do veículo → `disponível`
  - Transação atômica (tudo ou nada)

#### ✅ Checklist Fotográfico

- [ ] **Configuração (Admin)**
  - Cadastrar itens que devem ser vistoriados
  - Exemplos: pneus, lataria, vidros, óleo, interior, etc.
  - Definir se foto é obrigatória ou opcional
  - Ordem de apresentação

- [ ] **Execução (Motorista)**
  - Apresentar itens um a um
  - Para cada item:
    - Abrir câmera automaticamente
    - Tirar foto
    - Escolher: ✅ OK ou ⚠️ PROBLEMA
    - Se PROBLEMA:
      - Campo descrição (texto obrigatório)
      - Foto adicional como evidência (altamente recomendado)
  - Validação: não permitir finalizar checklist se houver problema sem descrição
  - Upload das fotos (compressão antes do envio)
  - Funcionar offline (fila de sincronização)

#### ⛽ Abastecimentos

- [ ] Registro de abastecimento
  - Veículo, motorista
  - Km no momento
  - Litros, valor total
  - Posto/localização
  - **Geolocalização capturada automaticamente**
  - Foto do cupom (opcional)

- [ ] Relatórios de consumo
  - Custo por km
  - Média de consumo por veículo
  - Comparativo entre veículos

#### 🔧 Manutenções

- [ ] **Manutenções preventivas**
  - Configurar alertas automáticos
  - Exemplo: "Trocar óleo a cada 5.000 km"
  - Sistema emite alerta quando km se aproxima
  - Admin visualiza alertas no dashboard

- [ ] **Manutenções corretivas**
  - Registrar problema reportado
  - Agendar serviço
  - Informar oficina, custo previsto
  - Registrar execução e custo real
  - Histórico completo por veículo

- [ ] **Estados da manutenção:**
  - `agendada` → Programada
  - `em execução` → Veículo na oficina
  - `concluída` → Serviço finalizado

#### 📍 Geolocalização

- [ ] **Captura automática:**
  - Ao iniciar jornada
  - Ao registrar abastecimento
  - Ao informar incidente
  - Ao encerrar jornada

- [ ] **Rastreamento em tempo real (opt-in)**
  - Motorista autoriza rastreamento
  - Envio periódico de coordenadas
  - Batch upload (otimização de bateria/dados)

- [ ] **Visualização (Admin)**
  - Mapa com veículos em uso
  - Atualização em tempo real
  - Histórico de trajeto por jornada

#### 📊 Relatórios e Dashboard

- [ ] **Dashboard administrativo**
  - Veículos: total, em uso, manutenção
  - Jornadas: ativas, finalizadas (período)
  - Custos: abastecimento, manutenção (período)
  - Alertas: manutenções pendentes, problemas críticos

- [ ] **Relatórios customizáveis**
  - Filtros: período, veículo, motorista, empresa
  - Exportar: PDF, Excel, CSV
  - Tipos:
    - Uso por veículo
    - Custos por veículo/motorista/período
    - Jornadas de trabalho (controle de ponto)
    - Problemas reportados

#### 🏢 Multi-empresa (Multi-tenant)

- [ ] Isolamento total de dados entre empresas
- [ ] Admin de cada empresa vê apenas seus dados
- [ ] Super-admin gerencia todas empresas
- [ ] Cadastro de empresas (CRUD)

### Regras de Negócio (NÃO VIOLÁVEIS)

Estas regras são críticas para a integridade do sistema:

#### 🔒 Integridade de Dados

1. **Quilometragem:**
   - km_final DEVE ser >= km_inicial (validação obrigatória)
   - km_atual do veículo é atualizado APENAS ao finalizar jornada
   - Transação atômica: falha reverte tudo

2. **Uma jornada por vez:**
   - Motorista não pode ter mais de 1 jornada `em andamento`
   - Veículo não pode estar em mais de 1 jornada simultânea
   - Validação no backend antes de criar jornada

3. **Checklist obrigatório:**
   - Não pode iniciar jornada sem checklist de saída
   - Não pode finalizar jornada sem checklist de entrada
   - Se item = PROBLEMA → descrição é obrigatória

4. **Veículos indisponíveis:**
   - Status `em manutenção` → não aparece para seleção
   - Status `problema crítico` → bloqueado
   - Apenas status `disponível` é selecionável

#### 📝 Auditoria

- **Todas ações críticas** devem gerar log de auditoria:
  - Login/logout
  - Criar/editar/deletar usuário
  - Criar/editar/deletar veículo
  - Iniciar/finalizar jornada
  - Criar checklist
  - Registrar abastecimento
  - Agendar/executar manutenção

- **Log deve conter:**
  - Quem (usuário)
  - O quê (ação)
  - Quando (timestamp)
  - Antes/Depois (estado anterior e novo)

#### 🔐 Segurança

- Senhas com hash seguro
- Tokens com expiração
- Rate limiting em endpoints críticos
- Validação de entrada em todos endpoints
- Sanitização de dados
- HTTPS obrigatório
- CORS configurado corretamente

---

## 🎨 Recursos Avançados Opcionais

Você pode implementar agora ou planejar para futuro:

### Inteligência Artificial

- **Reconhecimento de imagens**
  - ML para identificar avarias automaticamente nas fotos
  - Classificação de gravidade de problemas
  - Sugestão automática de descrição

- **Predição de manutenções**
  - ML baseado em histórico de uso
  - Prever falhas antes que ocorram
  - Otimizar calendário de manutenções

### Integrações

- **ERP corporativo**
  - Sincronização de custos
  - Centro de custo por veículo
  - Integração contábil

- **Oficinas parceiras**
  - App específico para oficinas
  - Cotação de serviços
  - Agendamento direto

### Otimizações

- **Rotas inteligentes**
  - Sugestão de rotas mais eficientes
  - Análise de consumo por trajeto
  - Economia de combustível

- **Analytics avançado**
  - Padrões de uso
  - Comportamento de motoristas
  - Benchmark entre veículos

---

## 🚀 Arquitetura e Stack

### Você tem TOTAL autonomia para escolher:

**Backend:**
- Linguagem (Node.js, Python, Go, Rust, Java, etc.)
- Framework (qualquer)
- Banco de dados (SQL, NoSQL, ambos)
- Arquitetura (monolito, microserviços, serverless)

**Frontend Web:**
- Framework (React, Vue, Angular, Svelte, etc.)
- UI Library (qualquer)
- State management (qualquer)

**Mobile:**
- Tecnologia (React Native, Flutter, Swift/Kotlin nativo)
- Navegação (qualquer)
- State management (qualquer)

**Infraestrutura:**
- Cloud provider (AWS, GCP, Azure, etc.)
- Containerização (Docker, Kubernetes)
- CI/CD (qualquer ferramenta)

**Storage de fotos:**
- Object storage (S3, GCS, Azure Blob, etc.)
- CDN (opcional)

### Considerações Importantes:

**Offline-first (Mobile):**
- App deve funcionar sem internet
- Fila de sincronização local
- Retry automático com backoff
- Resolução de conflitos

**Geolocalização:**
- Precisão adequada
- Otimização de bateria
- Permissões claras para usuário
- Funcionar em background (quando autorizado)

**Upload de fotos:**
- Compressão no dispositivo
- Upload em background
- Retry automático em falhas
- Progress indicator para usuário

**Multi-tenant:**
- Isolamento total de dados
- Performático mesmo com muitas empresas
- Billing por empresa (se aplicável)

---

## 📁 Estrutura de Arquivos Esperada

Organize seu projeto seguindo boas práticas do Antigravity:

```
frota2026/
├── .agent/                         # Configurações do Antigravity
│   ├── skills/                     # Skills customizadas
│   │   ├── deploy/
│   │   │   └── SKILL.md
│   │   └── test/
│   │       └── SKILL.md
│   └── rules/                      # Regras globais
│       └── rules.md
│
├── backend/                        # API e lógica de negócio
│   ├── src/
│   ├── tests/
│   ├── docker-compose.yml
│   └── README.md
│
├── frontend/                       # Painel web administrativo
│   ├── src/
│   ├── public/
│   └── README.md
│
├── mobile/                         # App mobile (motorista)
│   ├── src/
│   ├── assets/
│   └── README.md
│
├── docs/                           # Documentação
│   ├── api/                        # OpenAPI/Swagger
│   ├── architecture/               # Diagramas
│   └── deployment/                 # Guias de deploy
│
├── .gitignore
├── README.md                       # Overview do projeto
└── ARCHITECTURE.md                 # Decisões arquiteturais
```

---

## ✅ Critérios de Sucesso

Você terá sucesso quando:

### Funcional

✅ **Fluxo completo funciona end-to-end:**
- Motorista consegue fazer jornada completa (iniciar → checklist → uso → encerrar)
- Admin consegue ver tudo no painel
- Geolocalização é capturada e visualizada
- Fotos são enviadas e armazenadas corretamente

✅ **Regras de negócio respeitadas:**
- Validações funcionam (km, jornadas únicas, etc.)
- Checklists obrigatórios enforçados
- Veículos indisponíveis não aparecem
- Transações atômicas garantem consistência

✅ **Multi-tenant funciona:**
- Dados isolados entre empresas
- Cada admin vê apenas sua empresa
- Performance adequada

### Qualidade

✅ **Código profissional:**
- Limpo e bem estruturado
- Comentado onde necessário
- Padrões consistentes
- Fácil de entender

✅ **Testes adequados:**
- Unitários para lógica crítica
- Integração para fluxos principais
- E2E para casos de uso chave

✅ **Tratamento de erros:**
- Mensagens claras para usuário
- Logs estruturados
- Retry onde faz sentido
- Graceful degradation

### Operacional

✅ **Documentação completa:**
- README com instruções claras
- Como rodar localmente
- Como fazer deploy
- Troubleshooting

✅ **Deploy simplificado:**
- Processo documentado
- Automação (CI/CD)
- Variáveis de ambiente
- Migrations automáticas

✅ **Monitoramento:**
- Logs estruturados
- Métricas básicas
- Alertas configuráveis
- Health checks

### Experiência do Usuário

✅ **Mobile intuitivo:**
- Rápido de usar
- Feedback visual claro
- Funciona offline
- Câmera integrada bem

✅ **Painel web claro:**
- Dashboard informativo
- Navegação óbvia
- Filtros úteis
- Exportações funcionam

---

## 🎯 Como Começar

### Abordagem Recomendada (você pode adaptar):

**1. Planejamento (Artifacts primeiro)**
- Revise todos os requisitos
- Defina sua stack e justifique
- Desenhe arquitetura de alto nível
- Defina modelo de dados
- Crie plano de implementação em fases
- **Gere Artifacts para revisão antes de codificar**

**2. Foundation**
- Setup de repositório(s)
- Configuração de ambiente dev
- CI/CD básico
- Estrutura de pastas

**3. Backend Core**
- Autenticação
- CRUD de entidades básicas
- Lógica de jornadas (crítico)
- Checklists com validações

**4. Upload de Fotos**
- Storage configuration
- Upload endpoint
- Compressão
- Retry logic

**5. Frontend Web**
- Autenticação
- Dashboard
- CRUD de veículos/usuários
- Visualização de jornadas/checklists

**6. Mobile App**
- Autenticação
- Seleção de veículo
- Fluxo de jornada completo
- Checklist fotográfico
- Offline sync

**7. Geolocalização**
- Captura de coordenadas
- Armazenamento
- Visualização em mapa

**8. Manutenções e Alertas**
- CRUD de manutenções
- Sistema de alertas
- Notificações

**9. Multi-tenant**
- Isolamento de dados
- Gestão de empresas

**10. Polish e Deploy**
- Testes completos
- Documentação
- Performance
- Deploy em produção

---

## 💬 Comunicação e Artifacts

### Como trabalhar com o Antigravity:

**1. Sempre gere Artifacts antes de codificar:**
- Task List
- Implementation Plan
- Architecture Decision
- Deixe claro o que você vai fazer

**2. Seja específico em suas tarefas:**
- ❌ Ruim: "Criar backend"
- ✅ Bom: "Implementar endpoint POST /jornadas com validação de jornada única e transação atômica para atualizar veículo.km_atual"

**3. Trabalhe em incrementos verificáveis:**
- Pequenas entregas que podem ser testadas
- Cada commit deve funcionar
- Não deixe código quebrado

**4. Documente decisões importantes:**
- Por que escolheu X em vez de Y?
- Trade-offs considerados?
- Restrições encontradas?

**5. Use Skills quando relevante:**
- Crie skills para tarefas repetitivas
- Deploy, testes, migrations, etc.

---

## 🎓 Observações Finais

### Este é um sistema COMPLETO, não MVP:

Implemente todas as funcionalidades listadas. O objetivo é ter um produto **pronto para produção**, usado por empresas reais.

### É multi-empresa (SaaS):

Remova qualquer referência a "Grupo Paraopeba" ou empresa específica. Este é um produto genérico de controle de frota para **qualquer empresa**.

### Seja criativo:

Se identificar funcionalidades compatíveis com o ramo de atividade que não estão listadas aqui, sinta-se livre para implementar. Use seu julgamento de produto.

### Você é o Tech Lead:

- Tome decisões técnicas fundamentadas
- Balance qualidade vs velocidade
- Pense em manutenibilidade
- Considere escalabilidade

### Segurança é prioritária:

- Dados sensíveis (localização, jornadas de trabalho) requerem cuidado
- LGPD/GDPR compliance
- Auditoria completa
- Acesso controlado

---

## 🚀 Sua Missão

**Construa o melhor sistema de gestão de frotas que você conseguir.**

Você tem:
- ✅ Contexto completo de negócio
- ✅ Requisitos detalhados
- ✅ Regras de negócio claras
- ✅ Critérios de sucesso objetivos
- ✅ Autonomia total sobre decisões técnicas

**Agora é com você. Boa sorte!** 🎯

---

## 📚 Referências Úteis

### Documentação Fornecida:
- Todos os documentos na pasta `/mnt/project/`
- Especificações detalhadas de cada módulo
- Exemplos de fluxos e casos de uso

### Perguntas para Você Mesmo:

**"Por onde começar?"**
- Comece pelo core: autenticação + jornadas + checklists
- Depois adicione camadas: fotos, geolocalização, relatórios

**"Que tecnologias usar?"**
- Use o que você domina e tem confiança
- Considere: produtividade, manutenibilidade, comunidade

**"Como garantir qualidade?"**
- Testes nos fluxos críticos
- Code review (você mesmo, com calma)
- Deploy incremental

**"E se encontrar ambiguidade?"**
- Use seu julgamento
- Priorize a experiência do usuário
- Documente a decisão

**"MVP ou completo?"**
- **Completo**. Implemente todas funcionalidades listadas.

---

**Lembre-se: Este documento é um guia estratégico, não uma especificação técnica rígida. Você é o arquiteto e o desenvolvedor. Faça acontecer da melhor forma possível.**

**Boa construção! 🏗️**
