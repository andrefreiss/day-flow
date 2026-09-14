# Day Flow

Aplicação web para organização da rotina diária: tarefas com horário, subtarefas,
categorias, visualização em calendário e um painel com o andamento do dia.

## Status

Em desenvolvimento. A API já sobe com configuração de ambiente validada e um
endpoint de health check. Persistência, autenticação e interface web entram nas
próximas etapas.

## Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend** — NestJS, TypeScript, API REST
- **Banco** — PostgreSQL
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
pnpm dev:api
```

A API sobe em `http://localhost:3000/api`. Para conferir:

```bash
curl http://localhost:3000/api/health
```

## Variáveis de ambiente

O arquivo `apps/api/.env` nunca é versionado; o modelo está em
`apps/api/.env.example`.

| Variável     | Padrão        | O que faz                 |
| ------------ | ------------- | ------------------------- |
| `NODE_ENV`   | `development` | ambiente de execução      |
| `PORT`       | `3000`        | porta da API              |
| `API_PREFIX` | `api`         | prefixo de todas as rotas |

## Estrutura

```
apps/api/            API NestJS
  src/config/        configuração e validação do ambiente
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
| `pnpm test:e2e`     | testes end-to-end                 |
| `pnpm typecheck`    | verifica os tipos sem gerar build |
| `pnpm lint`         | roda o ESLint em todo o monorepo  |
| `pnpm format:check` | verifica a formatação             |
| `pnpm build`        | compila a aplicação               |
