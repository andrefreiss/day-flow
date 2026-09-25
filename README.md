# Day Flow

Aplicação web para organização da rotina diária: tarefas com horário, subtarefas,
categorias, visualização em calendário e um painel com o andamento do dia.

## Status

MVP full-stack funcional em desenvolvimento. A API e a interface web já cobrem
o fluxo principal de autenticação, organização e acompanhamento da rotina. As
próximas etapas são refinamento visual, ampliação dos testes e preparação para
deploy.

## Funcionalidades

- cadastro, login, sessão persistente e logout
- rotas públicas e protegidas no frontend
- resumo diário com total, concluídas, pendentes, atrasadas e próximas
- criação, edição, conclusão, reabertura e exclusão de tarefas
- prioridades, descrição e horários opcionais
- criação, edição e exclusão de categorias com cores
- associação de categorias às tarefas
- criação, edição, conclusão e exclusão de subtarefas
- navegação entre dias e seleção direta de data
- calendário mensal com quantidade e progresso das tarefas por dia
- validação de formulários e tratamento dos estados de carregamento e erro

## Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend** — NestJS, TypeScript, API REST
- **Banco** — PostgreSQL com Prisma
- **Testes** — Vitest, Testing Library, Supertest, jsdom
- **Ferramentas** — pnpm, ESLint, Prettier, Docker, GitHub Actions

O Docker é usado apenas para subir o PostgreSQL em desenvolvimento; a aplicação
roda direto no host.

## Requisitos

Node 24+, pnpm 12+ e Docker.

## Como executar

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
docker compose up -d
pnpm --filter @day-flow/api db:migrate
```

Inicie a API e o frontend em terminais separados:

```bash
pnpm dev:api
```

```bash
pnpm dev:web
```

O frontend fica disponível em `http://localhost:5173` e a API em
`http://localhost:3000/api`. Para conferir a API:

```bash
curl http://localhost:3000/api/health
```

## Variáveis de ambiente

Os arquivos `apps/api/.env` e `apps/web/.env` nunca são versionados. Os modelos
estão nos respectivos arquivos `.env.example`.

### API

| Variável                 | Padrão                  | O que faz                                          |
| ------------------------ | ----------------------- | -------------------------------------------------- |
| `NODE_ENV`               | `development`           | ambiente de execução                               |
| `PORT`                   | `3000`                  | porta da API                                       |
| `API_PREFIX`             | `api`                   | prefixo de todas as rotas                          |
| `WEB_ORIGIN`             | `http://localhost:5173` | origem permitida pelo CORS                         |
| `DATABASE_URL`           | —                       | conexão com o Postgres, obrigatória                |
| `DATABASE_TEST_URL`      | —                       | conexão usada pelos testes end-to-end              |
| `JWT_SECRET`             | —                       | chave de assinatura do token, mínimo 32 caracteres |
| `JWT_EXPIRES_IN_SECONDS` | `604800`                | validade do token e do cookie de sessão            |

### Frontend

| Variável       | Padrão                      | O que faz                    |
| -------------- | --------------------------- | ---------------------------- |
| `VITE_API_URL` | `http://localhost:3000/api` | endereço base usado pela web |

## Autenticação

A sessão trafega num **cookie `httpOnly`**, não em `localStorage`: o JavaScript
da página não consegue ler o token, então uma falha de XSS no frontend não
expõe a sessão. O cookie usa `sameSite=lax` contra CSRF e só exige HTTPS em
produção.

As senhas são guardadas com **argon2id**, primeira escolha da OWASP hoje.

O guard é global: **toda rota nasce protegida** e as públicas se declaram com
`@Public()`. O caminho contrário — proteger uma a uma — falha em silêncio
quando alguém esquece.

| Rota                  | Acesso    | O que faz                     |
| --------------------- | --------- | ----------------------------- |
| `POST /auth/register` | público   | cria a conta e abre a sessão  |
| `POST /auth/login`    | público   | abre a sessão                 |
| `POST /auth/logout`   | protegido | encerra a sessão              |
| `GET /auth/me`        | protegido | devolve o usuário autenticado |

## Interface web

O frontend usa React Router para separar páginas públicas e protegidas. Ao
recarregar a aplicação, a rota protegida consulta `GET /auth/me` antes de
mostrar o conteúdo, evitando confiar apenas em estado armazenado no navegador.

A página principal centraliza a data selecionada. Dashboard, calendário,
formulário e lista de tarefas recebem essa mesma referência, então navegar para
outro dia atualiza todos os blocos de forma consistente.

O calendário carrega as tarefas pelo intervalo completo do mês e mostra, em
cada dia, quantas foram concluídas. Datas são montadas no horário local em vez
de serem interpretadas como UTC, evitando deslocamentos de um dia.

## Categorias

Categorias pertencem ao usuário autenticado, têm nome único por usuário e uma
cor hexadecimal. Ao excluir uma categoria, as tarefas são mantidas e passam a
ficar sem categoria.

| Rota                     | O que faz |
| ------------------------ | --------- |
| `GET /categories`        | lista     |
| `POST /categories`       | cria      |
| `GET /categories/:id`    | detalha   |
| `PATCH /categories/:id`  | atualiza  |
| `DELETE /categories/:id` | remove    |

## Tarefas

Uma tarefa tem título, descrição, data, horários, status, prioridade e uma
categoria opcional. Concluir e reabrir são feitos pelo `PATCH` de `status` — o
`completedAt` é calculado pelo servidor na transição, nunca enviado pelo
cliente.

| Rota                | O que faz                                               |
| ------------------- | ------------------------------------------------------- |
| `GET /tasks`        | lista, com filtros `from`, `to`, `status`, `categoryId` |
| `POST /tasks`       | cria                                                    |
| `GET /tasks/:id`    | detalha                                                 |
| `PATCH /tasks/:id`  | atualiza, conclui e reabre                              |
| `DELETE /tasks/:id` | remove                                                  |

### Data e horário

A entrada e os filtros usam `YYYY-MM-DD`, e o banco guarda `date` como uma
coluna de data pura. Os horários são texto `HH:mm`: "academia às 07:00" continua
às 07:00 independentemente do fuso de quem abre o aplicativo.

Na resposta JSON, o driver pode serializar a data como um instante ISO. Por isso
o frontend usa somente a parte `YYYY-MM-DD` e cria datas locais pelos campos de
ano, mês e dia. Interpretar diretamente `2026-09-20T00:00:00.000Z` renderizaria
19 de setembro em fusos a oeste de Greenwich.

### Categoria de outro usuário

A chave estrangeira garante que a categoria existe, não que ela é sua. Por isso
o serviço confere o dono antes de vincular: sem essa checagem, bastaria passar
o id da categoria alheia.

## Subtarefas

Cada subtarefa pertence a uma tarefa e nasce pendente. O dono não é duplicado
na tabela de subtarefas: a autorização é herdada da tarefa, que precisa pertencer
ao usuário autenticado em todas as operações.

| Rota                                 | O que faz |
| ------------------------------------ | --------- |
| `GET /tasks/:taskId/subtasks`        | lista     |
| `POST /tasks/:taskId/subtasks`       | cria      |
| `GET /tasks/:taskId/subtasks/:id`    | detalha   |
| `PATCH /tasks/:taskId/subtasks/:id`  | atualiza  |
| `DELETE /tasks/:taskId/subtasks/:id` | remove    |

Ao remover uma tarefa, o banco também remove suas subtarefas por cascata.

## Dashboard

O dashboard recebe uma data de referência no formato `YYYY-MM-DD`. A data vem
do cliente para representar corretamente o calendário local do usuário, sem
depender do fuso do servidor.

| Rota                   | O que faz                                 |
| ---------------------- | ----------------------------------------- |
| `GET /dashboard?date=` | devolve as métricas da data de referência |

A resposta contém as tarefas concluídas e pendentes do dia, a quantidade de
tarefas atrasadas, as próximas tarefas pendentes e o percentual de progresso.
As contagens são calculadas pelo PostgreSQL por meio do Prisma, sem carregar
todas as tarefas na memória da aplicação.

## Banco de dados

O `docker compose up -d` sobe um PostgreSQL local descartável, com as mesmas
credenciais do `.env.example`.

O arquivo `apps/api/prisma/schema.prisma` é a fonte única da verdade do banco:
toda mudança de estrutura vira uma migration versionada, nunca um `ALTER TABLE`
aplicado à mão. Quem clona o projeto chega ao mesmo estado aplicando as
migrations.

O Prisma Client é gerado em `apps/api/src/generated/` e **não é versionado** —
o `postinstall` e o `build` o recriam a partir do schema.

| Comando                             | O que faz                                  |
| ----------------------------------- | ------------------------------------------ |
| `pnpm -F @day-flow/api db:migrate`  | cria e aplica migration a partir do schema |
| `pnpm -F @day-flow/api db:generate` | regenera o Prisma Client                   |
| `pnpm -F @day-flow/api db:deploy`   | aplica migrations existentes (CI/produção) |
| `pnpm -F @day-flow/api db:status`   | mostra migrations pendentes                |
| `pnpm -F @day-flow/api db:studio`   | abre o Prisma Studio                       |

## Estrutura

```
apps/
  api/                         API NestJS
    prisma/                    schema e migrations
    src/config/                configuração e validação do ambiente
    src/database/              conexão com o Postgres
    src/modules/               módulos de domínio
    test/                      testes end-to-end
  web/                         aplicação React
    src/features/auth/         autenticação e proteção de rotas
    src/features/calendar/     navegação e calendário mensal
    src/features/categories/   gerenciamento de categorias
    src/features/dashboard/    consumo do resumo diário
    src/features/subtasks/     gerenciamento de subtarefas
    src/features/tasks/        formulários e lista de tarefas
    src/pages/                 páginas da aplicação
.github/workflows/ci.yml       pipeline de integração contínua
tsconfig.base.json             TypeScript compartilhado
eslint.config.js               regras de lint do monorepo
docker-compose.yml             PostgreSQL de desenvolvimento
```

## Comandos

| Comando             | O que faz                                  |
| ------------------- | ------------------------------------------ |
| `pnpm dev:api`      | sobe a API em modo watch                   |
| `pnpm dev:web`      | sobe o frontend com Vite                   |
| `pnpm test`         | testes unitários da API e do frontend      |
| `pnpm test:e2e`     | testes end-to-end da API, exigem o banco   |
| `pnpm typecheck`    | verifica os tipos sem gerar build          |
| `pnpm lint`         | roda o ESLint em todo o monorepo           |
| `pnpm format`       | formata os arquivos com Prettier           |
| `pnpm format:check` | verifica a formatação sem alterar arquivos |
| `pnpm build`        | compila API e frontend                     |

## Testes

O frontend usa Vitest, Testing Library e jsdom. A suíte cobre os utilitários de
data, a navegação diária, o calendário mensal e as regras principais do
formulário de tarefas. Os testes não dependem de um navegador ou servidor em
execução.

A API tem testes unitários e 60 cenários end-to-end para autenticação, banco,
categorias, tarefas, subtarefas, dashboard e saúde. Os E2E rodam num **schema
separado** (`test`) do mesmo PostgreSQL, definido em `DATABASE_TEST_URL`. É por
isso que podem limpar as tabelas sem apagar os dados de desenvolvimento.

O `pnpm test:e2e` aplica as migrations no schema de teste antes de rodar, então
não há passo manual. Os arquivos rodam em série: eles compartilham um banco, e
em paralelo se sabotariam.

Uma sutileza do Prisma 7 que essa separação expõe: o `?schema=` da URL é
convenção do CLI, e o driver adapter o ignora. Por isso o `PrismaService` lê o
schema da URL e o passa explicitamente ao adapter — sem isso, as migrations vão
para um schema e a aplicação escreve noutro.

## Integração contínua

O workflow `.github/workflows/ci.yml` roda em todo pull request e em pushes para
`main`. Ele sobe um PostgreSQL isolado e executa, nesta ordem:

1. instalação com lockfile congelado
2. verificação de formatação
3. lint
4. typecheck
5. testes unitários da API e do frontend
6. testes end-to-end
7. build completo

## Próximos passos

- ampliar os testes dos fluxos de autenticação, categorias e subtarefas no frontend
- refinar responsividade, feedback visual e acessibilidade
- preparar ambientes e documentação de deploy
- adicionar observabilidade e tratamento de erros de produção
