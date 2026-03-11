## Main rule for Codex AI

You are my coding collaborator for Python, Node.js, and React.

General behavior:

- Only implement exactly what I request. Do not add extra features, abstractions, or optimizations.
- If a design or architectural decision is required, stop and ask me instead of choosing yourself.

Code style:

- Write minimal, clear, and straightforward code.
- Follow KISS (Keep It Simple).
- Avoid redundant logic and follow DRY where applicable.
- Do not duplicate folder structures or modules.

Implementation rules:

- Do not introduce optimizations unless I explicitly ask.
- Avoid unnecessary loops, iterations, or synchronous operations. Use them only when required.
- Keep functions and modules small and focused.

Communication:

- If requirements are unclear or multiple approaches exist, ask for clarification before writing code.

## Project Overview

This is a restaurant POS System written in React.js for frontend, FastAPI for backend. The project contains frontend and backend folders containing corresponding stack code.

### Backend Overview

Backend is written in clean code, used postgresql for database. For authentication, JWT + Oauth2.0 used. Environments must be separated to dev and prod. In Dev environment, database migration must be auto synchronized. For migration version controll alembic is used. Preferred project folder structure follows as:

backend/
├── config/
│   ├── database.py
│   ├── environment.py
│   ├── authentication.py
│   └── security.py
│
├── modules/
│   ├── auth/
│   │   ├── models.py
│   │   ├── router.py
│   │   ├── types.py
│   │   ├── helpers.py
│   │   ├── handlers/
│   │   │   └── __init__.py
│   │   └── schemas/
│   │       └── __init__.py
│   │
│   ├── products/
│   │   ├── models.py
│   │   ├── router.py
│   │   ├── types.py
│   │   ├── helpers.py
│   │   ├── handlers/
│   │   │   └── __init__.py
│   │   └── schemas/
│   │       └── __init__.py
│   │
│   └── payments/
│       ├── models.py
│       ├── router.py
│       ├── types.py
│       ├── helpers.py
│       ├── handlers/
│       │   └── __init__.py
│       └── schemas/
│           └── __init__.py
│
├── infra/
│   ├── websockets/
│   │   └── manager.py
│   ├── redis/
│   │   └── client.py
│   ├── sms/
│   │   └── provider.py
│   └── telegram/
│       └── bot.py
│
├── common/
│   ├── base_model.py
│   ├── base_schema.py
│   └── utils.py
│
├── main.py
├── requirements.txt
└── venv/

### Frontend Overview

Frontend code is written in typescript, react, material ui, vite. The frontend code must be written very minimal and simple in terms of logic side, but when it comes to design part, the code must be written efficiently, making the code run smoothly and wihtout glitches. Animations in the project must be minimal. Animations must be included but not too agressive. You must follow one global design pattern. Keep the ui design stupid simple, buttons with confirmation or submit buttons must be green, and cancel or reject or kinda negative buttons must be red. warning type of buttons must be yellow. base color of the frontend project must be white and orange.
Project folder structure is preferrable:

frontend/
├── public/
│   ├── favicon.ico
│   └── index.html
│
├── src/
│
│   ├── app/                        # application bootstrap
│   │   ├── App.tsx
│   │   ├── providers.tsx           # global providers (theme, router, query)
│   │   ├── router.tsx              # route configuration
│   │   └── store.ts                # global state (redux/zustand if used)
│
│   ├── config/                     # configuration files
│   │   ├── env.ts
│   │   ├── routes.ts
│   │   └── constants.ts
│
│   ├── theme/                      # Material UI theme
│   │   ├── theme.ts
│   │   ├── palette.ts
│   │   ├── typography.ts
│   │   └── components.ts           # MUI component overrides
│
│   ├── modules/                    # feature modules (business domains)
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── RegisterPage.tsx
│   │   │   ├── components/
│   │   │   │   └── LoginForm.tsx
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   ├── types.ts
│   │   │   └── store.ts
│   │   │
│   │   ├── users/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── api.ts
│   │   │   ├── hooks.ts
│   │   │   └── types.ts
│   │   │
│   │   └── dashboard/
│   │       ├── pages/
│   │       ├── components/
│   │       ├── api.ts
│   │       ├── hooks.ts
│   │       └── types.ts
│
│   ├── shared/                     # reusable across modules
│   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── DataTable.tsx
│   │   │   │   ├── ConfirmDialog.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDebounce.ts
│   │   │   └── usePagination.ts
│   │
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   ├── format.ts
│   │   │   └── validation.ts
│   │
│   │   ├── services/
│   │   │   ├── apiClient.ts        # axios/fetch wrapper
│   │   │   └── storage.ts
│   │
│   │   └── types/
│   │       └── common.ts
│
│   ├── assets/
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│
│   ├── styles/
│   │   └── global.css
│
│   ├── main.tsx                    # application entry
│   └── vite-env.d.ts
│
├── tests/
│
├── .env
├── .env.production
├── tsconfig.json
├── vite.config.ts
├── package.json
└── node_modules/

Important: The project folder structure above is an example folder structure meant to give a basic understanding of what kind of folder structure the developer prefers. So, the folder structure doensn't necessarily need to be exactly as given in the example.

