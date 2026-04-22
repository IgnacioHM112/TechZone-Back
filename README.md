# TechZone - E-Commerce de Componentes de PC 🖥️

Proyecto desarrollado para la cátedra de **Laboratorio de Computación III** en la **Universidad del Aconcagua**. TechZone es una plataforma de comercio electrónico robusta diseñada para la gestión y venta de hardware de alta gama.

---

## 👥 Integrantes del Equipo
Estamos conformados por un equipo de 5 desarrolladores enfocados en soluciones escalables:

* **Mello, Ignacio** (Backend Developer)
* **Miruy, Ramiro**
* **Videla, Nicolás**
* **Federici, Stefano**
* **Fernández, Lucas**

---

## 🛠️ Tecnologías Utilizadas

El proyecto se basa en un stack moderno centrado en la eficiencia y la integridad de los datos:

* **Entorno de Ejecución:** [Node.js](https://nodejs.org/) (Motor de JavaScript del lado del servidor)
* **Framework Web:** [Express.js](https://expressjs.com/)
* **Base de Datos:** [MySQL](https://www.mysql.com/) (Relacional)
* **Autenticación:** JSON Web Tokens (JWT)
* **Pasarela de Pagos:** Integración con Mercado Pago API

---

## 🚀 Características Principales

- [x] **Gestión de Usuarios:** Registro, login y perfiles protegidos.
- [x] **Catálogo de Productos:** Filtrado por categorías (GPUs, CPUs, Periféricos, etc.).
- [x] **Carrito de Compras:** Persistencia de productos seleccionados.
- [x] **Checkout Seguro:** Integración de pagos y validación de stock.
- [x] **Panel Administrativo:** Control de inventario y visualización de ventas.

---

## 📋 Requisitos Previos

Asegúrate de tener instalado lo siguiente:
* [Node.js](https://nodejs.org/) (v16 o superior)
* [MySQL Server](https://dev.mysql.com/downloads/installer/)
* Un gestor de paquetes como `npm` o `yarn`

---

## 🔧 Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/tu-usuario/nombre-del-repo.git](https://github.com/tu-usuario/nombre-del-repo.git)
    cd nombre-del-repo
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto y añade tus credenciales:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=tu_contraseña
    DB_NAME=techzone_db
    JWT_SECRET=tu_clave_secreta
    ```

4.  **Ejecutar el proyecto:**
    ```bash
    npm start
    ```

---

## 📁 Estructura del Proyecto

```text
├── src
│   ├── config      # Configuración de BD y variables
│   ├── controllers # Lógica de las rutas
│   ├── middlewares # Validaciones y seguridad
│   ├── models      # Definición de tablas y queries SQL
│   ├── routes      # Definición de endpoints API
│   └── app.js      # Punto de entrada de la aplicación
├── .env.example    # Ejemplo de variables de entorno
└── README.md