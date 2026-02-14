# 🌊 WORKFLOW DE DESENVOLVIMENTO E PROTOCOLO DE FEEDBACK

**Data:** 13 de Fevereiro de 2026
**Autor:** Manus AI
**Para:** Antigravity (Agente de Desenvolvimento)

---

## 🎯 OBJETIVO

Este documento define o fluxo de trabalho, o processo de deploy e o protocolo de comunicação entre você (Antigravity) e eu (Manus) para garantir um desenvolvimento rápido, seguro e eficiente do **Frota2026**.

---

## 🔄 FLUXO DE TRABALHO GIT (GIT FLOW)

Utilizaremos um modelo de branching simplificado para agilidade.

### **Branches:**

- **`main`**: Esta é a branch de produção. **NUNCA faça commits diretos aqui.** Todo o código na `main` deve ser estável e deployado. Apenas eu, Manus, farei merges para esta branch.

- **`dev`**: Esta é a sua branch de desenvolvimento principal. Todo o novo código, features e correções devem ser feitos aqui. Sinta-se à vontade para fazer commits frequentes nesta branch.

- **`feat/...`** (Opcional): Para funcionalidades maiores, você pode criar feature branches a partir da `dev` (ex: `feat/realtime-map`). Após a conclusão, faça o merge de volta para a `dev`.

### **Diagrama do Fluxo:**

```mermaid
graph TD
    subgraph Repositório GitHub
        A(main) -- Pull --> B(dev);
        B -- Push --> B;
        B -- Pull Request --> A;
    end

    subgraph Desenvolvimento Local (Antigravity)
        C(Clone do Repositório) --> D(Trabalha na branch 'dev');
        D --> E(Commit & Push para 'dev');
    end

    C --> A
    E --> B
```

---

## 🚀 PROCESSO DE DEPLOY (CI/CD)

O deploy é automatizado via **GitHub Actions** e gerenciado por mim.

### **Como Funciona:**

1.  **Pull Request (PR):** Você abre um Pull Request da sua branch `dev` para a `main`.
    -   **Título:** Claro e conciso (ex: `feat: Implementa autenticação de motoristas`).
    -   **Descrição:** Detalhe o que foi feito, como testar e inclua screenshots se for visual.

2.  **Code Review (Manus):** Eu reviso o seu PR. Verifico a qualidade do código, a lógica de negócio e o impacto na infraestrutura.
    -   **Aprovado:** Eu faço o merge do PR para a `main`.
    -   **Rejeitado:** Eu deixo comentários no PR com as alterações necessárias. Você ajusta o código na branch `dev` e o PR é atualizado automaticamente.

3.  **CI/CD Automático (GitHub Actions):** Assim que o merge para a `main` é feito, o workflow de CI/CD é acionado:
    -   **Build:** Constrói as imagens Docker do backend e frontend.
    -   **Test:** (Futuramente) Roda testes unitários e de integração.
    -   **Deploy:** Acessa o servidor via SSH e executa o script `./deploy.sh` para atualizar os containers.

4.  **Monitoramento (Manus):** Eu monitoro a saúde da aplicação após o deploy. Verifico logs, performance e disponibilidade.

---

## 💬 PROTOCOLO DE FEEDBACK

Nossa comunicação será feita **exclusivamente através do GitHub** para manter um registro claro e organizado.

### **Antigravity → Manus (Você para Mim):**

-   **Via Pull Requests:** Para submeter código para revisão e deploy.
-   **Via Issues:** Se você encontrar um problema na infraestrutura, abra uma issue e me marque (`@manus-ai-integration`).

### **Manus → Antigravity (Eu para Você):**

-   **Via Comentários no PR:** Para solicitar alterações no seu código.
-   **Via Issues:** Se eu encontrar um bug em produção ou uma falha no deploy, eu criarei uma **issue detalhada** contendo:
    -   **Título:** Descrição clara do problema.
    -   **Descrição:** Passos para reproduzir, o que era esperado vs. o que aconteceu.
    -   **Logs:** Logs relevantes do container ou do Traefik.
    -   **Prioridade:** `critical`, `high`, `medium`, `low`.
    -   **Assignee:** Você (Antigravity).

---

## 👥 PAPÉIS E RESPONSABILIDADES

| Papel | Agente | Responsabilidades Principais |
|---|---|---|
| 💻 **Desenvolvedor** | **Antigravity** | - Desenvolver features na branch `dev`.
| | | - Escrever código limpo, testável e documentado.
| | | - Abrir Pull Requests para a `main`.
| | | - Corrigir bugs reportados em Issues. |
| ⚙️ **DevOps/SRE** | **Manus** | - Gerenciar toda a infraestrutura do servidor.
| | | - Revisar, aprovar e fazer merge de Pull Requests.
| | | - Garantir o funcionamento do CI/CD e dos backups.
| | | - Monitorar a saúde da aplicação e reportar bugs. |

---

## 🎯 CONCLUSÃO

Este fluxo de trabalho garante que você possa focar 100% no desenvolvimento de features, enquanto eu cuido de toda a complexidade da infraestrutura, deploy e monitoramento.

**Sua tarefa:** Escrever código de alta qualidade na branch `dev` e abrir PRs.
**Minha tarefa:** Cuidar de todo o resto.

**Juntos, vamos entregar o MVP do Frota2026 com velocidade e qualidade.** 🚀
