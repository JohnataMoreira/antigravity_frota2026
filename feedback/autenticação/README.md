# 🔐 Sistema de Autenticação Robusto — NestJS

> Autenticação de nível produção com JWT + Google OAuth 2.0, blindada contra ataques, falhas de conexão, bugs e atualizações do sistema.

---

## Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  accessToken: memória JS     │   refreshToken: cookie HttpOnly   │
└────────────────┬────────────────────────────┬────────────────────┘
                 │ Bearer Token                │ Cookie automático
┌────────────────▼────────────────────────────▼────────────────────┐
│                        NESTJS API                                │
│                                                                  │
│  SecurityMiddleware → ThrottlerGuard → JwtAuthGuard → RolesGuard │
│                              │                                   │
│        ┌─────────────────────┼──────────────────────┐           │
│        │                     │                      │           │
│   POST /auth/login    GET /auth/google      POST /auth/refresh   │
│   LocalStrategy       GoogleStrategy        JwtRefreshStrategy  │
│        │                     │                      │           │
│        └─────────────────────┼──────────────────────┘           │
│                              │                                   │
│                         AuthService                              │
│                    generateTokenPair()                           │
│                    validateCredentials()                         │
│                    revokeToken() ──────────► Redis (blacklist)   │
│                              │                                   │
│                         UsersService                             │
│                    (transações atômicas)                         │
│                              │                                   │
│                         PostgreSQL                               │
└──────────────────────────────────────────────────────────────────┘
```

---

## Camadas de Defesa

### Contra Ataques
| Vetor | Defesa Implementada |
|-------|---------------------|
| Força bruta | ThrottlerModule: 5 tentativas/15min por IP+email |
| Timing attack | bcrypt dummy hash para usuários inexistentes |
| XSS + token theft | Access token em memória JS; Refresh em cookie HttpOnly |
| CSRF | SameSite=Strict + path restrito no cookie |
| SQL/NoSQL Injection | ValidationPipe whitelist + SecurityMiddleware patterns |
| OAuth hijacking | URIs fixas + state CSRF automático do Passport |
| Enumeração de usuários | Mensagem genérica sempre + timing constante |
| Refresh token roubado | Hash bcrypt + rotação com invalidação + blacklist Redis |
| MITM | HTTPS + HSTS + cookies Secure |
| Clickjacking | X-Frame-Options: DENY |
| Info disclosure | AllExceptionsFilter sanitiza erros em produção |
| Payload malicioso | SecurityMiddleware detecta padrões de injeção |

### Contra Falhas e Bugs
| Problema | Solução |
|----------|---------|
| Variáveis de ambiente inválidas | `validateConfig()` recusa inicialização |
| Banco de dados caído | Reconexão automática (10 tentativas, 3s) + healthcheck |
| Redis indisponível | Fail-open seguro — não bloqueia usuários válidos |
| Request preso/travado | TimeoutInterceptor: 30s máximo por requisição |
| Processo crashando | `uncaughtException` + `unhandledRejection` handlers |
| Race condition em cadastro | Transação TypeORM com lock pessimista |
| Query lenta degradando sistema | `maxQueryExecutionTime: 3000ms` — alerta automático |
| Graceful shutdown | `app.enableShutdownHooks()` — fecha conexões com segurança |
| Contas travadas indefinidamente | AuthScheduler: desbloqueio automático a cada 5min |
| Tokens órfãos acumulando | Limpeza diária automática de sessões inativas |
| Atualizações do sistema | Migrations TypeORM versionadas + `synchronize: false` em prod |

---

## Início Rápido

```bash
# 1. Clone e instale
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores

# 3. Suba infraestrutura (Postgres + Redis)
docker-compose up -d postgres redis

# 4. Rode em desenvolvimento
npm run start:dev

# 5. Acesse a documentação
open http://localhost:3000/api/docs
```

---

## Endpoints

| Método | Rota | Descrição | Auth |
|--------|------|-----------|------|
| POST | `/v1/auth/register` | Criar conta | Público |
| POST | `/v1/auth/login` | Login com email/senha | Público |
| GET | `/v1/auth/google` | Iniciar OAuth Google | Público |
| GET | `/v1/auth/google/callback` | Callback OAuth | Público |
| POST | `/v1/auth/refresh` | Renovar access token | Cookie |
| POST | `/v1/auth/logout` | Encerrar sessão | JWT |
| GET | `/v1/auth/me` | Dados do usuário atual | JWT |
| GET | `/v1/health` | Health check completo | Público |
| GET | `/v1/health/ready` | Readiness probe | Público |
| GET | `/v1/health/live` | Liveness probe | Público |

---

## Fluxo de Tokens

```
Login bem-sucedido
       │
       ├──► accessToken (JWT, 15min) ──► Armazenado em memória no frontend
       │                                  Enviado como: Authorization: Bearer <token>
       │
       └──► refreshToken (JWT, 7d) ────► Armazenado em cookie HttpOnly+Secure+SameSite=Strict
                                          Enviado automaticamente em: POST /auth/refresh
                                          
Quando accessToken expira:
       └──► POST /auth/refresh ──► Novo accessToken + Novo refreshToken (rotação)
                                    Token antigo é invalidado no Redis (blacklist)
```

---

## Proteção contra Roubo de Refresh Token

Se um token rotacionado for usado novamente (sinal de roubo):
1. O sistema detecta que o hash não corresponde ao atual
2. **Toda a sessão do usuário é invalidada imediatamente**
3. O incidente é logado com IP e timestamp
4. O usuário precisará fazer login novamente

---

## Estrutura de Arquivos

```
src/
├── main.ts                    # Bootstrap com Helmet, CORS, ValidationPipe
├── app.module.ts              # Módulo raiz com ThrottlerModule e CacheModule
├── config/
│   ├── env.validation.ts      # Validação de variáveis — recusa inicialização se inválido
│   └── database.config.ts     # Config TypeORM com reconexão automática
├── auth/
│   ├── auth.controller.ts     # Endpoints de auth
│   ├── auth.service.ts        # Lógica de negócio + geração de tokens
│   ├── auth.module.ts         # Módulo com guards globais
│   ├── auth.scheduler.ts      # Tarefas automáticas de manutenção
│   ├── strategies/            # LocalStrategy, JwtStrategy, JwtRefresh, Google
│   ├── guards/                # JwtAuthGuard, RolesGuard, LocalAuthGuard...
│   ├── decorators/            # @Public(), @CurrentUser(), @Roles()
│   └── dto/                   # LoginDto, RegisterDto com validação estrita
├── users/
│   ├── user.entity.ts         # Entidade com controle de tentativas e bloqueio
│   └── users.service.ts       # CRUD com transações atômicas
├── common/
│   ├── filters/               # AllExceptionsFilter — sanitiza erros em produção
│   ├── interceptors/          # TimeoutInterceptor, LoggingInterceptor (sem dados sensíveis)
│   └── middleware/            # SecurityMiddleware — detecta injeções e limita payload
└── health/
    └── health.module.ts       # Healthcheck para banco, memória e liveness
```
