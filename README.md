# 💻 TechZone-Back - API REST 🚀

¡Bienvenido al repositorio de **TechZone-Back**! Esta es la API robusta y escalable que alimenta la plataforma de e-commerce TechZone. Construida con un enfoque en el rendimiento, la seguridad y la facilidad de integración.

---

## 🛠️ Tecnologías

Este proyecto utiliza un stack moderno y potente para garantizar la mejor experiencia de desarrollo y ejecución:

| Tecnología | Propósito |
| :--- | :--- |
| **Node.js** | Entorno de ejecución para JavaScript. |
| **Express** | Framework web rápido y minimalista. |
| **MySQL** | Sistema de gestión de bases de datos relacionales. |
| **Sequelize** | ORM para interactuar con MySQL de forma sencilla. |
| **JWT** | Autenticación basada en JSON Web Tokens. |
| **Cloudinary** | Gestión y almacenamiento de imágenes en la nube. |
| **Mercado Pago** | Integración de pasarela de pagos. |
| **Jest & Supertest** | Pruebas unitarias e integración. |

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una estructura de carpetas organizada por responsabilidades para facilitar el mantenimiento y la escalabilidad:

```bash
src/
├── config/       # ⚙️ Configuraciones de DB, Cloudinary y Mercado Pago.
├── controllers/  # 🧠 Lógica de negocio de los endpoints.
├── database/     # 🗄️ Scripts de inicialización y seeders.
├── middlewares/  # 🛡️ Funciones de validación y seguridad (Auth).
├── models/       # 📐 Definición de modelos de datos con Sequelize.
├── routes/       # 🛣️ Definición de rutas y mapeo a controladores.
├── services/     # 🛠️ Servicios externos (Chatbot, etc).
├── utils/        # 🧰 Utilidades generales (Generador de PDF).
└── server.js     # 🏁 Punto de entrada de la aplicación.
```

---

## 🔐 Autenticación y Seguridad

La seguridad es nuestra prioridad. Implementamos un flujo de autenticación basado en **JWT (JSON Web Tokens)**:

1.  **Registro/Login**: El usuario envía sus credenciales.
2.  **Token**: Tras validar, el servidor genera un token firmado.
3.  **Autorización**: El cliente debe incluir el token en el header `Authorization: Bearer <token>` para rutas protegidas.
4.  **Roles**: El sistema distingue entre `User` y `Admin`, restringiendo acciones críticas (como crear productos) solo a administradores.

---

## 📝 Endpoints Principales

A continuación, se detallan las rutas principales de la API:

| Módulo | Endpoint | Método | Descripción | Protegida |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/register` | `POST` | Registro de nuevos usuarios. | No |
| **Auth** | `/api/auth/login` | `POST` | Inicio de sesión y obtención de token. | No |
| **Productos** | `/api/products` | `GET` | Listar productos (soporta filtros). | No |
| **Productos** | `/api/products` | `POST` | Crear producto (con subida de imagen). | Sí (Admin) |
| **Categorías**| `/api/categories` | `GET` | Listar todas las categorías. | No |
| **Carrito** | `/api/cart` | `GET` | Ver el carrito del usuario actual. | Sí |
| **Órdenes** | `/api/orders` | `POST` | Crear una orden de compra. | Sí |

---

## 🚀 Instalación y Configuración

Sigue estos pasos para poner en marcha el proyecto localmente:

### 1. Clonar el repositorio
```bash
git clone https://github.com/IgnacioHM112/TechZone-Back.git
cd TechZone-Back
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```env
PORT=3000
DB_NAME=techzone_db
DB_USER=root
DB_PASSWORD=tu_password
DB_HOST=localhost
JWT_SECRET=tu_secreto_super_seguro
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
MP_ACCESS_TOKEN=...
```

### 4. Iniciar la Base de Datos
El proyecto usa Sequelize con sincronización automática. Al iniciar el servidor, las tablas se crearán/actualizarán automáticamente y se ejecutarán los seeders iniciales.

### 5. Correr el servidor
```bash
# Modo Desarrollo
npm run dev

# Modo Producción
npm start
```

---

## 👥 Integrantes del Equipo

Un proyecto desarrollado con pasión por:

*   👤 **Ignacio Mello**
*   👤 **Lucas Fernandez**
*   👤 **Nicolas Videla**

---

© 2026 TechZone Team. Todos los derechos reservados.
