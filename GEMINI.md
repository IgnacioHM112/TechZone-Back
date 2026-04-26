# TechZone-Back - Guía de Proyecto

## 📌 Estándares de Ingeniería
- **Arquitectura:** Basada en Controladores, Modelos (Sequelize) y Rutas.
- **Base de Datos:** Uso estricto de **Sequelize ORM** con sincronización automática (`alter: true`) al arrancar el servidor.
- **Modelos:** Todos los modelos deben incluir `timestamps: true` con mapeo a `created_at` y `updated_at`.
- **Autenticación:** Implementada con **JWT** y **bcryptjs**. Los tokens deben manejarse en el header `Authorization: Bearer <token>`.
- **Nomenclatura:** 
  - Archivos en `camelCase`.
  - Modelos en `PascalCase`.
  - Endpoints en `kebab-case`.

## 🛠 Estructura de Carpetas
- `src/config/`: Configuraciones (Base de Datos).
- `src/controllers/`: Lógica de negocio de los endpoints.
- `src/middlewares/`: Funciones de paso (Auth, Validaciones).
- `src/models/`: Definición de modelos de Sequelize.
- `src/routes/`: Definición de rutas Express.
- `src/tests/`: Pruebas unitarias e integración.

## 🔑 Autenticación
- **Register:** `POST /api/auth/register` (name, email, password, roleName).
- **Login:** `POST /api/auth/login` (email, password). Devuelve token y datos del usuario.
- **Profile:** `GET /api/auth/profile` (Requiere Token).

## 📦 Productos y Categorías
- **GET /api/products:** Soporta filtros por query string:
  - `name`: Búsqueda parcial.
  - `category_id`: ID de categoría exacto.
  - `minPrice` / `maxPrice`: Rango de precios.
  - `sort`: `price_asc` o `price_desc`.
- **Gestión:** Endpoints de creación, actualización y borrado protegidos para rol `admin`.
