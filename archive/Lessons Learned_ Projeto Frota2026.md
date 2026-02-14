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

## Checklist para o Antigravity

- [ ] **Teste o build localmente antes de fazer push.**
- [ ] **Instale todas as dependências necessárias antes de fazer commit.**
- [ ] **Verifique a versão das ferramentas no ambiente de produção.**
- [ ] **Faça commit das suas mudanças locais antes de fazer pull.**
- [ ] **Use `React.lazy` para componentes que só rodam no cliente.**
- [ ] **Adicione verificações de nulidade ao acessar dados que podem não existir.**
