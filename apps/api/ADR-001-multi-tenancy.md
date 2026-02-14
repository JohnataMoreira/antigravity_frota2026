# ADR 001: Isolamento Multi-Tenant via Prisma Client Extensions

## Status
Aceito (Aprovado na Fase 5)

## Contexto
O projeto Frota2026 é um SaaS multi-tenant que exige isolamento rigoroso de dados entre organizações. A implementação anterior dependia de filtragem manual em cada query (`where: { organizationId }`), o que é propenso a falhas humanas e vazamento de dados (Cross-Tenant Inquiry). Com o objetivo de suportar 1k+ organizações e 100k usuários, precisamos de segurança global por design.

## Decisão
Implementar isolamento lógico automatizado utilizando:
1. **AsyncLocalStorage (TenantContext)**: Para propagar o `organizationId` do JWT por todo o ciclo de vida da requisição sem poluir a assinatura dos métodos.
2. **Prisma Client Extensions**: Uma camada de "interceptação" em nível de banco que injeta automaticamente filtros de leitura e metadados de escrita em todos os modelos que possuem `organizationId`.

## Consequências
- **Positivas**:
    - **Segurança**: Eliminação do risco de esquecer filtros de organização nas queries.
    - **DX (Developer Experience)**: Código dos serviços fica muito mais limpo e focado na lógica de negócio.
    - **Previsibilidade**: O isolamento é testado uma única vez na camada de infraestrutura.
- **Negativas/Riscos**:
    - **Tipagem**: O Prisma Client gerado perde parcialmente a tipagem forte em chamadas de criação (exige cast para `any` no DTO, pois o campo se torna opcional para a API, mas obrigatório para o DB).
    - **Performance**: Pequeno overhead de processamento por query para injetar os filtros.
