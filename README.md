![TechZone Banner](../Archivos/6%20-%20Banner.png)

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
| **Mercado Pago** | Integración de pasarela de pagos profesional. |
| **Groq / Llama 3** | Inteligencia Artificial para el Chatbot de atención al cliente. |
| **PDFKit** | Generación dinámica de comprobantes de compra en PDF. |
| **Jest & Supertest** | Pruebas unitarias e integración. |

---

## 🌟 Características Destacadas

- **🤖 IA Chatbot Support**: Asistente inteligente integrado con **Groq (Llama 3)** que conoce el catálogo real de productos y ayuda a los usuarios con consultas técnicas y recomendaciones.
- **💳 Pasarela de Pagos**: Integración completa con **Mercado Pago**, incluyendo creación de preferencias, procesamiento de pagos y webhooks para notificaciones en tiempo real.
- **📄 Generación de Comprobantes**: Creación automática de facturas/comprobantes en formato PDF tras finalizar una compra.
- **🖼️ Gestión Multimedia**: Subida de imágenes de productos directamente a **Cloudinary**.
- **🔌 API para Automatizaciones**: Endpoints protegidos por API Key para integraciones externas (ej: Make.com, Zapier) y control de stock.
- **🛒 Flujo Completo de E-commerce**: Gestión de carrito, órdenes, categorías y productos con filtros avanzados.

---

## 🏗️ Arquitectura del Proyecto

El proyecto sigue una estructura de carpetas organizada por responsabilidades para facilitar el mantenimiento y la escalabilidad:

```bash
src/
├── config/       # ⚙️ Configuraciones de DB, Cloudinary y Mercado Pago.
├── controllers/  # 🧠 Lógica de negocio de los endpoints.
├── database/     # 🗄️ Scripts de inicialización y seeders.
├── middlewares/  # 🛡️ Funciones de validación (Auth, Admin, API Key).
├── models/       # 📐 Definición de modelos de datos con Sequelize.
├── routes/       # 🛣️ Definición de rutas y mapeo a controladores.
├── services/     # 🤖 Lógica compleja (Chatbot Service).
├── utils/        # 🧰 Utilidades generales (Generador de PDF).
└── server.js     # 🏁 Punto de entrada de la aplicación.
```

---

## 📝 Endpoints Principales

A continuación, se detallan las rutas principales de la API:

### 🔐 Autenticación
| Endpoint | Método | Descripción | Protegida |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Registro de nuevos usuarios. | No |
| `/api/auth/login` | `POST` | Inicio de sesión y obtención de token. | No |
| `/api/auth/profile` | `GET` | Obtener perfil del usuario autenticado. | Sí |

### 📦 Productos y Categorías
| Endpoint | Método | Descripción | Protegida |
| :--- | :--- | :--- | :--- |
| `/api/products` | `GET` | Listar productos (filtros: name, category_id, minPrice, maxPrice). | No |
| `/api/products/:id` | `GET` | Detalle de un producto. | No |
| `/api/products` | `POST` | Crear producto (Multipart/Form-Data para imagen). | Sí (Admin) |
| `/api/categories` | `GET` | Listar todas las categorías. | No |

### 🛒 Carrito de Compras
| Endpoint | Método | Descripción | Protegida |
| :--- | :--- | :--- | :--- |
| `/api/cart` | `GET` | Obtener el carrito del usuario. | Sí |
| `/api/cart/add` | `POST` | Agregar producto al carrito. | Sí |
| `/api/cart/item/:id` | `DELETE` | Eliminar un item específico del carrito. | Sí |
| `/api/cart/clear` | `DELETE` | Vaciar el carrito. | Sí |

### 💳 Órdenes y Pagos
| Endpoint | Método | Descripción | Protegida |
| :--- | :--- | :--- | :--- |
| `/api/orders/create-preference` | `POST` | Iniciar proceso de pago con Mercado Pago. | Sí |
| `/api/orders/confirm` | `POST` | Confirmar pago y finalizar orden. | Sí |
| `/api/orders/:id` | `GET` | Ver detalles de una orden. | Sí |
| `/api/orders/:id/download` | `GET` | Descargar comprobante de compra en PDF. | Sí |
| `/api/orders/webhook` | `POST` | Webhook para notificaciones de Mercado Pago. | No |

### 🤖 Chatbot IA
| Endpoint | Método | Descripción | Protegida |
| :--- | :--- | :--- | :--- |
| `/api/chatbot/` | `POST` | Enviar mensaje al chatbot (Contexto de catálogo). | No |
| `/api/chatbot/reset` | `POST` | Reiniciar el historial del chat. | No |

### 🔌 Externos (Automatizaciones)
| Endpoint | Método | Descripción | Protegida |
| :--- | :--- | :--- | :--- |
| `/api/external/stock-check` | `GET` | Consulta de stock para herramientas externas. | Sí (API Key) |

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

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Mercado Pago
MP_ACCESS_TOKEN=...

# AI (Groq)
GROQ_API_KEY=...

# External
EXTERNAL_API_KEY=tu_api_key_externa
```

### 4. Iniciar la Base de Datos
El proyecto usa Sequelize con sincronización automática (`alter: true`). Al iniciar el servidor, las tablas se crearán o actualizarán automáticamente. Se ejecutarán seeders básicos de roles y categorías si no existen.

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
