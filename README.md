# Prueba Técnica Racional — Lucas Martínez

Monorepo full-stack para el desafío de Racional: API de inversiones (Parte 1) y visualización en tiempo real con Firestore (Parte 2).

## Estructura del proyecto

```
prueba-tecnica-racional/
├── packages/
│   ├── racional-api/     # Express API (TypeScript + Prisma + Supabase)
│   └── racional-app/     # React App (Vite + Tailwind + Supabase + Firebase)
├── package.json          # pnpm workspace root
└── pnpm-workspace.yaml
```

---

## Setup inicial

### Requisitos

- Node.js >= 18
- pnpm >= 9 (`npm install -g pnpm`)
- Cuenta en [Supabase](https://supabase.com) (gratuita)
- API key de [Finnhub](https://finnhub.io) (gratuita, registro sin tarjeta)

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

**API:**
```bash
cp packages/racional-api/.env.example packages/racional-api/.env
# Editar con tus credenciales de Supabase y Finnhub
```

**App:**
```bash
cp packages/racional-app/.env.example packages/racional-app/.env
# Editar con tus credenciales de Supabase
```

### 3. Ejecutar migraciones en Supabase

```bash
pnpm prisma:migrate
# Ingresa un nombre para la migración, ej: "init"
```

### 4. (Opcional) Cargar datos de ejemplo

```bash
# Primero registra un usuario en la app y copia su UUID desde Supabase Auth
SEED_USER_ID=<tu-uuid> pnpm prisma:seed
```

### 5. Levantar en modo desarrollo

```bash
pnpm dev          # Levanta API (puerto 3000) y App (puerto 5173) en paralelo
pnpm dev:api      # Solo la API
pnpm dev:app      # Solo la App
```

---

## API — Rutas

Base URL: `http://localhost:3000/api`

Documentación interactiva: `http://localhost:3000/api/docs` (Swagger UI)

Todos los endpoints requieren header `Authorization: Bearer <supabase_jwt>`.

### Usuarios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/users/me` | Perfil del usuario autenticado |
| `PATCH` | `/users/me` | Editar información personal (`full_name`, `phone`) |

### Portafolios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/portfolios` | Listar portafolios del usuario |
| `POST` | `/portfolios` | Crear portafolio (`name`, `description?`, `currency`) |
| `PATCH` | `/portfolios/:id` | Editar información del portafolio |
| `GET` | `/portfolios/:id/total` | Total del portafolio con precios en tiempo real (Finnhub) |

### Transacciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/portfolios/:portfolioId/transactions` | Registrar depósito o retiro |

**Body:**
```json
{
  "type": "DEPOSIT",
  "amount": "1000.50",
  "date": "2024-01-15T10:00:00Z",
  "description": "Depósito inicial"
}
```

### Órdenes

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/portfolios/:portfolioId/orders` | Registrar orden de compra o venta |

**Body:**
```json
{
  "type": "BUY",
  "ticker": "AAPL",
  "quantity": "10",
  "price_per_unit": "175.50",
  "date": "2024-01-15T10:00:00Z"
}
```

### Movimientos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/portfolios/:portfolioId/movements` | Historial unificado (depósitos + retiros + órdenes) con paginación por cursor |

**Query params:** `limit` (default 20, max 100), `cursor` (ISO 8601 para paginación)

### Stocks

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/stocks/search?q=AAPL` | Búsqueda de acciones via Finnhub |

---

## Modelo de datos

### Diagrama de entidades

```
User (1) ──── (N) Portfolio (1) ──── (N) Transaction
                      │                      [DEPOSIT | WITHDRAWAL]
                      │
                      ├──────────── (N) Order
                      │                  │
                      │            Stock ─┤
                      │                  │
                      └──────────── (N) PortfolioHolding ←── Stock
```

### Tablas

#### `users`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | Mismo ID que `auth.users` de Supabase |
| `full_name` | VARCHAR | Nombre completo |
| `phone` | VARCHAR? | Teléfono opcional |

#### `portfolios`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | — |
| `user_id` | UUID FK | Referencia a `users.id` |
| `name` | VARCHAR | Nombre del portafolio |
| `currency` | CHAR(3) | Moneda (default: USD) |

#### `transactions`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | — |
| `portfolio_id` | UUID FK | Referencia a `portfolios.id` |
| `type` | ENUM | `DEPOSIT` o `WITHDRAWAL` |
| `amount` | DECIMAL(18,6) | Monto con precisión de 6 decimales |
| `date` | TIMESTAMP | Fecha de la transacción |

#### `stocks`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | — |
| `ticker` | VARCHAR UNIQUE | Símbolo bursátil (ej: AAPL) |
| `name` | VARCHAR | Nombre de la empresa |
| `exchange` | VARCHAR? | Bolsa donde cotiza |

#### `orders`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID PK | — |
| `portfolio_id` | UUID FK | Referencia a `portfolios.id` |
| `stock_id` | UUID FK | Referencia a `stocks.id` |
| `type` | ENUM | `BUY` o `SELL` |
| `quantity` | DECIMAL(18,6) | Cantidad de acciones |
| `price_per_unit` | DECIMAL(18,6) | Precio por unidad al momento de la orden |
| `total_amount` | DECIMAL(18,6) | `quantity * price_per_unit` |
| `date` | TIMESTAMP | Fecha de la orden |

#### `portfolio_holdings`
Caché desnormalizada de posiciones actuales. Se actualiza atómicamente con cada `Order` en una transacción de base de datos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `portfolio_id` + `stock_id` | UNIQUE | Clave compuesta |
| `quantity` | DECIMAL(18,6) | Cantidad neta actual |
| `average_cost` | DECIMAL(18,6) | Costo promedio ponderado |

### Justificación de decisiones

- **`DECIMAL(18,6)` para valores monetarios**: Evita errores de punto flotante. Los valores se serializan como `string` en JSON para preservar precisión al cruzar la red.
- **`decimal.js` en capa de aplicación**: Toda aritmética (costo promedio, P&L, totales) usa `decimal.js` en lugar de primitivos `number`.
- **`portfolio_holdings` como caché**: Permite calcular el total del portafolio en O(holdings) sin recalcular desde todas las órdenes históricas. La consistencia está garantizada por la transacción atómica en `PlaceOrderUseCase`.
- **Índices compuestos en `date DESC`**: Optimizan la paginación del historial de movimientos.
- **Cursor pagination por fecha**: Evita inconsistencias con offset pagination cuando se insertan datos en tiempo real.
- **Costo promedio ponderado**: `new_avg = (old_avg × old_qty + price × qty) / (old_qty + qty)` — fórmula estándar.

---

## Arquitectura

### Screaming Architecture + Clean Architecture

Cada dominio es una carpeta que revela lo que hace el sistema:

```
src/
├── users/           # Gestión de usuarios
├── portfolios/      # Portafolios de inversión
├── transactions/    # Depósitos y retiros
├── orders/          # Órdenes de compra/venta
├── stocks/          # Búsqueda de acciones
├── movements/       # Feed unificado de movimientos
└── shared/          # Infraestructura compartida
```

Tres capas dentro de cada dominio:
- **`domain/`**: Entidades e interfaces (sin dependencias externas)
- **`application/`**: Casos de uso (orquestan dominio a través de interfaces)
- **`infrastructure/`**: Implementaciones concretas (Prisma, Express, Finnhub)

### SOLID

| Principio | Aplicación |
|-----------|------------|
| **S** | Un use-case = una acción. Router solo parsea HTTP. Repository solo accede a datos. |
| **O** | Nuevos features = nuevos use-cases, sin modificar lógica existente. |
| **L** | `PrismaUserRepository implements IUserRepository` — intercambiable sin romper use-cases. |
| **I** | `IOrderRepository` separado de `IPortfolioHoldingRepository`. Interfaces mínimas. |
| **D** | Use-cases reciben interfaces por constructor. Routers inyectan dependencias. |

---

## Scripts disponibles

```bash
pnpm dev             # Levanta API + App en paralelo
pnpm build           # Build de producción (ambos packages)
pnpm build:api       # Build solo de la API
pnpm build:app       # Build solo de la App
pnpm start:api       # Corre la API compilada
pnpm lint            # ESLint en ambos packages
pnpm format          # Prettier en ambos packages
pnpm prisma:generate # Regenerar Prisma Client
pnpm prisma:migrate  # Ejecutar migraciones en Supabase
pnpm prisma:seed     # Cargar datos de ejemplo
```

---

## Uso de IA

**Herramientas utilizadas:** Claude Code (Anthropic) como asistente principal durante todo el desarrollo.

**Cómo lo integré:**

1. **Diseño de arquitectura**: Usé Claude Code en modo plan para definir la arquitectura completa antes de escribir código. Dialogamos sobre decisiones clave: Supabase vs PostgreSQL local, cómo manejar la precisión de decimales, el patrón de holdings atómicos.

2. **Scaffolding**: Claude generó toda la estructura de carpetas, configuraciones de TypeScript, ESLint, Prettier, Husky y pnpm workspaces.

3. **Lógica de negocio crítica**: El `PlaceOrderUseCase` con actualización atómica de `portfolio_holdings` usando `prisma.$transaction` y `decimal.js` para el cálculo del costo promedio ponderado fue diseñado en colaboración con Claude.

4. **Correcciones de TypeScript**: Claude detectó y corrigió errores de tipos en callbacks de Prisma, tipado de `$transaction`, y migración a la API de TanStack Query v5.

5. **UI/UX**: El diseño del dashboard, evolution chart y sistema de colores fue definido priorizando legibilidad de datos financieros en modo oscuro.

**Decisiones donde la IA fue clave:**
- Usar `decimal.js` + `DECIMAL(18,6)` para evitar errores de punto flotante en cálculos financieros.
- `portfolio_holdings` como caché desnormalizada vs. recalcular siempre desde órdenes históricas.
- Cursor pagination por fecha para el feed de movimientos, evitando inconsistencias con datos en tiempo real.
