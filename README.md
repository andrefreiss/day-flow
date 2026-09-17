# Day Flow

Aplicação web para organização da rotina diária: tarefas com horário, subtarefas,
categorias, visualização em calendário e um painel com o andamento do dia.

## Status

Em desenvolvimento. A API tem cadastro, login, rotas protegidas e o CRUD de
categorias, tarefas e subtarefas. O dashboard e a interface web entram nas
próximas etapas.

## Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend** — NestJS, TypeScript, API REST
- **Banco** — PostgreSQL com Prisma
- **Ferramentas** — pnpm, ESLint, Prettier, Vitest

O Docker é usado apenas para subir o PostgreSQL em desenvolvimento; a aplicação
roda direto no host.

## Requisitos

Node 24+, pnpm 12+ e Docker.

## Como executar

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
docker compose up -d
pnpm --filter @day-flow/api db:migrate
pnpm dev:api
```

A API sobe em `http://localhost:3000/api`. Para conferir:

```bash
curl http://localhost:3000/api/health
```

## Variáveis de ambiente

O arquivo `apps/api/.env` nunca é versionado; o modelo está em
`apps/api/.env.example`.

| Variável                 | Padrão        | O que faz                                          |
| ------------------------ | ------------- | -------------------------------------------------- |
| `NODE_ENV`               | `development` | ambiente de execução                               |
| `PORT`                   | `3000`        | porta da API                                       |
| `API_PREFIX`             | `api`         | prefixo de todas as rotas                          |
| `DATABASE_URL`           | —             | conexão com o Postgres, obrigatória                |
| `JWT_SECRET`             | —             | chave de assinatura do token, mínimo 32 caracteres |
| `JWT_EXPIRES_IN_SECONDS` | `604800`      | validade do token e do cookie de sessão            |

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

A `date` é uma coluna `date` pura e trafega como `"2026-09-20"`, sem instante.
Os horários são texto `"HH:mm"`. É hora de parede: "academia às 07:00" continua
às 07:00 independentemente do fuso de quem abre o aplicativo.

Devolver a data como instante seria o caminho para o erro de data mais comum
que existe — `new Date("2026-09-20T00:00:00.000Z")` renderiza 19 de setembro em
qualquer fuso a oeste de Greenwich.

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
apps/api/            API NestJS
  prisma/            schema e migrations
  src/config/        configuração e validação do ambiente
  src/database/      conexão com o Postgres
  src/modules/       um módulo por domínio
  test/              testes end-to-end
tsconfig.base.json   configuração de TypeScript compartilhada
eslint.config.js     regras de lint de todo o monorepo
docker-compose.yml   PostgreSQL de desenvolvimento
```

## Comandos

| Comando             | O que faz                         |
| ------------------- | --------------------------------- |
| `pnpm dev:api`      | sobe a API em modo watch          |
| `pnpm test`         | testes unitários                  |
| `pnpm test:e2e`     | testes end-to-end, exigem o banco |
| `pnpm typecheck`    | verifica os tipos sem gerar build |
| `pnpm lint`         | roda o ESLint em todo o monorepo  |
| `pnpm format:check` | verifica a formatação             |
| `pnpm build`        | compila a aplicação               |

## Testes

Os testes end-to-end rodam num **schema separado** (`test`) do mesmo
PostgreSQL, definido em `DATABASE_TEST_URL`. É por isso que eles podem limpar
as tabelas à vontade sem apagar os dados do seu desenvolvimento.

O `pnpm test:e2e` aplica as migrations no schema de teste antes de rodar, então
não há passo manual. Os arquivos rodam em série: eles compartilham um banco, e
em paralelo se sabotariam.

Uma sutileza do Prisma 7 que essa separação expõe: o `?schema=` da URL é
convenção do CLI, e o driver adapter o ignora. Por isso o `PrismaService` lê o
schema da URL e o passa explicitamente ao adapter — sem isso, as migrations vão
para um schema e a aplicação escreve noutro.
