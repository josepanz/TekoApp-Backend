# TekoApp テコ - Plataforma de Servicios Profesionales 🛠️

![TekoApp Banner](https://example.com/path/to/your/banner.png) <!-- Reemplaza con tu imagen -->

**Conectamos clientes con profesionales calificados en tiempo real**

## 🌟 Descripción

**TekoApp** es una plataforma innovadora que conecta a usuarios con profesionales de diversas categorías (electricistas, plomeros, pintores, etc.) de manera rápida y segura. Inspirada en modelos como Uber, Bolt, Pedidos Ya, etc., pero para servicios profesionales, ofrece:

- ✅ Doble Rol: Los usuarios pueden registrarse como clientes o profesionales.
- 📍 Geolocalización en tiempo real de profesionales disponibles
- ⭐ Sistema de calificaciones bidireccional (clientes ↔ profesionales)
- 💰 Precios dinámicos establecidos por cada profesional
- 📱 Aplicación móvil y versión web integradas

1. **En guaraní**: El nombre "Teko" proviene del guaraní y significa "vida" o "estilo de vida", representando nuestra misión de mejorar la vida de las personas conectándolas con los mejores profesionales.
   - Significa *"vida" o "estilo de vida"*, representando nuestra misión de mejorar el día a día de las personas.
   - Representa la conexión entre los profesionales y los clientes.
   - Evoca un sentido de comunidad y bienestar.
3. **En japonés (テコ)**: Significa *"palanca"*, simbolizando cómo nuestra app sirve como herramienta para **conectar y potenciar** oportunidades entre profesionales y clientes, lo que añade un significado poderoso y simbólico reforzando el concepto de conexión y facilitación de servicios.
   - Escritura japonesa: テコ (katakana) / 梃子 (kanji menos común).
   - Significado:
     - Palanca (herramienta física que multiplica fuerza).
     - Apalancamiento (en contexto figurado: "ser un puente" o "facilitador").
     - Uso: Es una palabra reconocida en japonés, aunque no es de uso cotidiano (se usa más en contextos técnicos/mecánicos).
## ♟️ El poder detrás del nombre "Teko"

| Idioma   | Escritura | Significado        | Simbolismo para la app                  |
|----------|-----------|--------------------|------------------------------------------|
| Guaraní  | Teko      | "Vida"             | Conectar estilos de vida                 |
| Japonés  | テコ      | "Palanca"          | Ser el puente que potencia oportunidades |

## 🚀 Repositorios

| Componente       | Enlace                                                              | Tecnologías Principales                 p|
|------------------|---------------------------------------------------------------------|-----------------------------------------|
| **Backend**      | [TekoApp-Backend](https://github.com/josepanz/TekoApp-Backend)      | NestJS, MongoDB, PostgreSQL, Docker     |
| **Frontend App** | [TekoApp-Frontend](https://github.com/josepanz/TekoApp-Frontend-App)| Flutter                                 |
| **Frontend Web** | [TekoApp-Frontend](https://github.com/josepanz/TekoApp-Frontend-Web)| React.js, Tailwind CSS                  |

## 🛠️ Tecnologías

### Backend
- **NestJS** - Framework backend modular
- **MongoDB** - Base de datos NoSQL para datos flexibles
- **PostgreSQL** - Base de datos SQL para transacciones críticas
- **TypeORM** - ORM para bases de datos
- **JWT** - Autenticación segura
- **Google Maps API** - Integración de mapas
- **Firebase Cloud Messaging** - Notificaciones push
- **Docker** - Contenerización y despliegue

#### Estructura del Proyecto
````bash
TekoApp-Backend/
├── src/
│   ├── auth/                  # Autenticación (JWT, OAuth)
│   ├── users/                 # Gestión de usuarios (clientes/profesionales)
│   ├── professionals/         # Lógica específica de profesionales
│   ├── services/              # Solicitudes de servicios
│   ├── ratings/               # Sistema de calificaciones
│   ├── locations/             # Geolocalización en tiempo real
│   ├── shared/                # Utilidades comunes (middlewares, guards)
│   └── main.ts                # Punto de entrada
├── .env                       # Variables de entorno
├── docker-compose.yml         # Configuración para Docker
└── README.md                  # Documentación adicional
````

#### 🔧 Instalación
##### 1. Clona el repositorio:
````bash
git clone https://github.com/josepanz/TekoApp-Backend.git
````

##### 2. Instala dependencias:
````bash
npm install
````

##### 3. Configura las variables de entorno (.env):
````env
DATABASE_URL=mongodb://localhost:27017/tekoapp
POSTGRES_URL=postgres://user:password@localhost:5432/tekoapp
JWT_SECRET=tu_clave_secreta
GOOGLE_MAPS_API_KEY=tu_api_key
````
##### 4. Ejecuta en desarrollo:
````bash
npm run start:dev
````

### Frontend
- **Flutter** - Aplicación móvil multiplataforma
- **React.js** - Versión web
- **Tailwind CSS** - Estilos para la web
- **Provider** - Gestión de estado (Flutter)
- **Redux** - Gestión de estado (React)
- **Google Maps SDK** - Integración de mapas

#### Estructura del proyecto
````bash
TekoApp-Frontend/
├── lib/                       # Código Flutter
│   ├── screens/               # Pantallas (login, mapa, perfil)
│   ├── widgets/               # Componentes reutilizables
│   ├── models/                # Modelos de datos
│   ├── services/              # Llamadas a la API
│   └── main.dart              # Punto de entrada
├── web/                       # Versión web (React.js)
│   ├── public/
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── pages/             # Páginas web
│   │   └── App.jsx            # Punto de entrada
│   └── tailwind.config.js     # Configuración de Tailwind
└── README.md                  # Documentación adicional
````

#### 📲 Instalación (Flutter)
##### 1. Clona el repositorio:
````bash
git clone https://github.com/josepanz/TekoApp-Frontend-App.git
````

##### 2. Instala dependencias:
````bash
flutter pub get
````

##### 3. Configura las variables de entorno (lib/config/env.dart):
````env
const String API_URL = "http://localhost:3000";
const String GOOGLE_MAPS_API_KEY = "tu_api_key";
````

##### 4. Ejecuta la app:
````bash
flutter run
````

#### 🌐 Instalación (Web - React.js)
##### 1. Clona el repositorio:
````bash
git clone https://github.com/josepanz/TekoApp-Frontend-Web.git
````

##### 2. Entra a la carpeta web:
````bash
cd web
````

##### 3.Instala dependencias:
````bash
npm install
````
##### 4. Ejecuta en desarrollo:
````bash
npm start
````
#### 📦 Despliegue
##### Backend: Usa Docker para empaquetar y desplegar en AWS/GCP:
````bash
docker-compose up --build
````
##### Frontend:
###### - Flutter: Genera APK/IPA con flutter build.
###### - React.js: Despliega en Vercel/Netlify.

📢 Nota: Asegúrate de configurar correctamente las claves de API (Google Maps, Firebase) y las variables de entorno antes de desplegar.

### 🤝 Cómo Contribuir
1. Haz fork del proyecto
2. Crea tu rama (git checkout -b feature/nueva-funcionalidad)
3. Haz commit de tus cambios (git commit -m 'Añade nueva funcionalidad')
4. Haz push a la rama (git push origin feature/nueva-funcionalidad)
5. Abre un Pull Request

## ✉️ Contacto
José Panza - En X @PanzerPy - josepanza1@gmail.com

✨ "Conectando talento con necesidad, donde sea, cuando sea."
