# TechZone-Back — Contexto para Agentes IA

## Stack
- **Runtime:** Node.js (CommonJS)
- **Framework:** Express 5.2.1
- **ORM:** Sequelize 6.37.8 + MySQL 8.0 (mysql2)
- **Auth:** JWT (jsonwebtoken 9) + bcryptjs 3 + RBAC (roles: `admin`, `usuario`)
- **Pagos:** Mercado Pago SDK 2.12
- **IA:** Groq (Llama 3.3-70b) via groq 5.22
- **Imágenes:** Cloudinary + multer-storage-cloudinary
- **PDF:** PDFKit 0.18
- **Email:** Nodemailer 9
- **Tests:** Jest 30 + Supertest 7
- **Proxy:** express-http-proxy (forward non-API → `localhost:5173`)

## Arranque
```bash
npm install              # instalar deps
docker-compose up -d     # levantar MySQL 8.0
npm run dev              # nodemon src/server.js (puerto 3000)
npm test                 # jest --detectOpenHandles
```

`src/server.js` → dotenv → Express → CORS → rutas → proxy catch-all. En startup: `sequelize.sync({ alter: true })` + seeders (roles, admin, categorías, 50 productos). Si `NODE_ENV=test`, omite `app.listen()`.

## Estructura
```
src/
├── server.js                # Entry point + bootstrap
├── config/
│   ├── database.js          # Sequelize connection
│   ├── cloudinary.js        # Cloudinary + multer config
│   └── mercadopago.js       # MP SDK init
├── models/                  # sequelize.define, timestamps:true, table names en español
│   ├── role.js              → roles
│   ├── user.js              → usuarios (FK rol_id)
│   ├── category.js          → categorias
│   ├── product.js           → productos (FK category_id, active BOOLEAN)
│   ├── cart.js              → carritos (FK user_id, UNIQUE)
│   ├── cartItem.js          → carrito_items (FK cart_id + product_id)
│   ├── order.js             → ordenes (FK user_id, ENUM status)
│   └── orderItem.js         → orden_items (FK order_id + product_id)
├── controllers/             # Lógica de negocio
│   ├── authController.js    # register, login, profile, forgot/reset-password, users CRUD
│   ├── categoryController.js
│   ├── productController.js # CRUD + filtros (name, category_id, minPrice, maxPrice, sort, page, limit)
│   ├── cartController.js    # get, add, remove item, clear
│   ├── orderController.js   # create-preference, confirm, webhook, history, detail, download PDF
│   ├── chatbotController.js # message, reset, email (stateless)
│   └── externalController.js# stock-check (API Key)
├── routes/                  # Mapeo directo a controllers
│   ├── authRoutes.js        → /api/auth/*
│   ├── categoryRoutes.js    → /api/categories/*
│   ├── productRoutes.js     → /api/products/*
│   ├── cartRoutes.js        → /api/cart/*
│   ├── orderRoutes.js       → /api/orders/*
│   ├── chatbotRoutes.js     → /api/chatbot/*
│   └── externalRoutes.js    → /api/external/*
├── middlewares/
│   ├── authMiddleware.js    # verifyToken (JWT), isAdmin (rol), resolveUser (opcional)
│   └── apiKeyMiddleware.js  # x-api-key header check
├── services/
│   ├── emailService.js      # Nodemailer (reset password)
│   └── chatbotService.js    # Groq AI con contexto de productos + usuario
├── utils/
│   └── pdfGenerator.js      # PDFKit invoice
├── tests/
│   └── auth.test.js         # 2 tests: register + login
└── database/
    ├── init.sql             # SQL base
    ├── migrate.js           # Migración standalone
    ├── seeders.js           # Datos iniciales
    └── updateProductImages.js
```

## Convenciones de Código
- Archivos: `camelCase.js`
- Modelos: `PascalCase`
- Endpoints: `kebab-case`
- Tablas: nombres en español, underscored (`created_at`, `updated_at`)
- Todos los modelos llevan `timestamps: true`
- Los controladores NO tienen comentarios salvo JSDoc cuando es necesario

## API — Resumen Rápido

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Registro (name, email, password, confirmPassword, roleName) |
| POST | /api/auth/login | — | Login → JWT |
| POST | /api/auth/forgot-password | — | Solicitar reset |
| POST | /api/auth/reset-password | — | Reset con token |
| GET | /api/auth/profile | JWT | Perfil propio |
| GET | /api/auth/users | JWT+admin | Lista usuarios + órdenes |
| DELETE | /api/auth/users/:id | JWT+admin | Eliminar usuario |
| GET | /api/categories | — | Lista paginada (page, limit) |
| GET | /api/categories/:id | — | Una categoría |
| POST | /api/categories | JWT+admin | Crear |
| PUT | /api/categories/:id | JWT+admin | Actualizar |
| DELETE | /api/categories/:id | JWT+admin | Eliminar |
| GET | /api/products | —* | Lista con filtros. *oculta inactivos/sin stock para no-admins |
| GET | /api/products/:id | — | Un producto |
| POST | /api/products | JWT+admin | Crear (multipart: image) |
| PUT | /api/products/:id | JWT+admin | Actualizar (multipart) |
| DELETE | /api/products/:id | JWT+admin | Eliminar |
| GET | /api/cart | JWT | Carrito del usuario |
| POST | /api/cart/add | JWT | Agregar (product_id, quantity) |
| DELETE | /api/cart/item/:item_id | JWT | Quitar/disminuir (body: quantity opcional) |
| DELETE | /api/cart/clear | JWT | Vaciar |
| POST | /api/orders/create-preference | JWT | Crear preferencia MP |
| POST | /api/orders/confirm | JWT | Confirmar pago manual |
| POST | /api/orders/webhook | — | Webhook MP (notificación automática) |
| GET | /api/orders | JWT | Historial del usuario |
| GET | /api/orders/:id | JWT | Detalle (dueño o admin) |
| GET | /api/orders/:id/download | JWT | Descargar PDF factura |
| POST | /api/chatbot | opt JWT | Mensaje al chatbot |
| POST | /api/chatbot/reset | — | Resetear historial |
| POST | /api/chatbot/email | opt JWT | Respuesta por email (stateless) |
| GET | /api/external/stock-check | API Key | Consulta stock (query: q) |

## Modelos — Relaciones
```
Role 1───* User
User 1───1 Cart
Cart 1───* CartItem → *───1 Product
User 1───* Order
Order 1───* OrderItem → *───1 Product
Category 1───* Product
```

## Filtros de Productos
`GET /api/products` acepta query params: `name` (LIKE), `category_id` (exacto), `minPrice`, `maxPrice`, `sort` (price_asc|price_desc), `page` (default 1), `limit` (default 10). Admin ve todo; no-admin ve solo `active=true` y `stock>0`.

## Autenticación
- **JWT:** `{ id, email, role }` firmado con `JWT_SECRET`, expira 8h. Header: `Authorization: Bearer <token>`.
- **RBAC:** middleware `isAdmin` chequea `req.user.role === 'admin'`.
- **API Key:** header `x-api-key` → coteja con `EXTERNAL_API_KEY`.
- **resolveUser:** middleware que decodifica JWT si existe, o sigue como guest (usado en chatbot).
- **Password reset:** token crypto random, expira 1h, enviado por email.

## Pago (Mercado Pago)
1. `POST /api/orders/create-preference` → crea preferencia MP + orden pendiente, devuelve `init_point`.
2. Frontend redirige a MP → success/failure URL.
3. `POST /api/orders/confirm` (manual tras redirect) + `POST /api/orders/webhook` (automático MP).
4. Ambos llaman a `processOrderCompletion()`: transacción que descuenta stock, genera PDF, limpia carrito.

## Chatbot (Groq AI)
- Modelo: `llama-3.3-70b-versatile`
- Contexto dinámico: catálogo de productos + carrito e historial del usuario (si autenticado).
- Endpoint `/api/chatbot/email` es stateless (recibe history en body).

## Variables de Entorno (.env)
```
PORT=3000
DB_HOST=localhost / DB_PORT=3306 / DB_USER=root / DB_PASSWORD= / DB_NAME=techstore_db
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=... / CLOUDINARY_API_KEY=... / CLOUDINARY_API_SECRET=...
MP_ACCESS_TOKEN=... / MP_SUCCESS_URL=... / MP_FAILURE_URL=...
GROQ_API_KEY=... / EXTERNAL_API_KEY=...
SMTP_HOST=smtp.gmail.com / SMTP_PORT=465 / SMTP_USER=... / SMTP_PASS=... / SMTP_SECURE=true / EMAIL_FROM=...
```

## Seeders (ejecutan en startup)
- Roles: `admin`, `usuario`
- Admin por defecto: `admin@gmail.com` / `Admin1234`
- 10 categorías (Procesadores, GPU, RAM, Almacenamiento, Motherboards, Fuentes, Gabinetes, Refrigeración, Periféricos, Accesorios)
- 50 productos

## Testing
```bash
npm test   # jest --detectOpenHandles
```
Tests en `src/tests/`. Usan `Date.now()` para emails únicos. `afterAll` cierra Sequelize.

## Docker
`solo MySQL`: `docker-compose up -d` (MySQL 8.0, puerto 3306, sin password).

## Notas Clave para el Agente
- **No generar archivos nuevos a menos que se solicite explícitamente.** Preferir editar los existentes.
- **No agregar comentarios en código** a menos que el usuario lo pida.
- **Seguir convenciones existentes** (camelCase, PascalCase, kebab-case según corresponda).
- **No modificar `.env`** — los valores sensibles no deben tocarse ni exponerse.
- **Siempre verificar lint/tests** después de hacer cambios con `npm test`.
- **`sync({ alter: true })`** significa que no hay migrations formales; los cambios a modelos se reflejan automáticamente al reiniciar.
- **El proxy catch-all** redirige todo lo que no es `/api/*` a `http://localhost:5173` (frontend en dev).
- **No commitear a menos que el usuario lo pida explícitamente.**
