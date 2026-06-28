# GitHub Codespaces Setup

Repository:

```text
https://github.com/tengtianyukino5-beep/AI
```

## Option A: Upload With GitHub Desktop

1. Open GitHub Desktop.
2. Sign in with the GitHub account `tengtianyukino5-beep`.
3. Choose `File -> Add local repository`.
4. Select this folder:

```text
C:\Users\qishu\Documents\New project
```

5. If GitHub Desktop says it is not a Git repository, choose `create a repository`.
6. Commit all files.
7. Publish or push to:

```text
https://github.com/tengtianyukino5-beep/AI
```

## Option B: Upload With Git Command Line

Use this only after Git is installed and logged in.

```bash
cd "C:\Users\qishu\Documents\New project"
git init
git branch -M main
git add .
git commit -m "Build AI arbitrage web MVP"
git remote add origin https://github.com/tengtianyukino5-beep/AI.git
git push -u origin main
```

If the remote already has files, use GitHub Desktop first because it gives a clearer conflict UI.

## Open In Codespaces

1. Open the repository page:

```text
https://github.com/tengtianyukino5-beep/AI
```

2. Click `Code`.
3. Click `Codespaces`.
4. Click `Create codespace on main`.
5. Wait for the dev container to finish.
6. Run:

```bash
pnpm dev
```

## Open Ports

| Port | Service |
| ---: | --- |
| 5173 | Web app |
| 3000 | API |
| 3000/api-docs | Swagger |
| 5432 | PostgreSQL |
| 6379 | Redis |

## Demo Accounts

Customer:

```text
demo@example.jp / 123456
```

Admin:

```text
yuki888 / 123456
```

## Safety Boundary

The MVP is a site-internal AI arbitrage simulation.

It does not place real external exchange orders.

Simulated profits, operation rewards, manual balance adjustments, and invitation rewards remain separate ledger types.
