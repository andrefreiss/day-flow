# Day Flow

Aplicação web para organização da rotina diária: tarefas com horário, subtarefas,
categorias, visualização em calendário e um painel com o andamento do dia.

## Status

Em desenvolvimento. Esta etapa entrega apenas a fundação do repositório —
workspace, configuração compartilhada e banco de desenvolvimento. A API e a
interface entram nas próximas etapas.

## Stack

- **Frontend** — React, TypeScript, Vite, Tailwind CSS, React Router
- **Backend** — NestJS, TypeScript, API REST
- **Banco** — PostgreSQL
- **Ferramentas** — pnpm, ESLint, Prettier

O Docker é usado apenas para subir o PostgreSQL em desenvolvimento; a aplicação
roda direto no host.

## Requisitos

Node 24+, pnpm 12+ e Docker.

## Como executar

```bash
pnpm install
docker compose up -d
```

## Estrutura

```
apps/                aplicações do monorepo
tsconfig.base.json   configuração de TypeScript compartilhada
eslint.config.js     regras de lint de todo o monorepo
docker-compose.yml   PostgreSQL de desenvolvimento
```

## Comandos

| Comando             | O que faz                          |
| ------------------- | ---------------------------------- |
| `pnpm lint`         | roda o ESLint em todo o monorepo   |
| `pnpm format`       | formata os arquivos com o Prettier |
| `pnpm format:check` | verifica a formatação              |
