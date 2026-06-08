<div align="center">

# TekoApp テコ - Plataforma de Servicios Profesionales 🛠️

![TekoApp Banner](https://example.com/path/to/your/banner.png) 

**Conectando talento con necesidad, donde sea, cuando sea.**

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Flutter](https://img.shields.io/badge/Flutter-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

</div>

---

## 🌟 Descripción

**TekoApp** es una plataforma innovadora de economía colaborativa diseñada para conectar a usuarios con profesionales de servicios de oficio (electricistas, plomeros, pintores, etc.) de manera rápida, segura y geolocalizada. 

Inspirada en la eficiencia logística de modelos como Uber o Bolt, pero adaptada al sector de servicios profesionales, TekoApp ofrece:

- 🔄 **Doble Rol:** Una única cuenta permite al usuario operar como Cliente o Profesional.
- 📍 **Tracking en Tiempo Real:** Geolocalización y telemetría de profesionales disponibles.
- ⭐ **Reputación Bidireccional:** Sistema de calificaciones mutuas para garantizar confianza.
- 💰 **Economía Dinámica:** Precios establecidos por cada profesional y pagos integrados.
- 📱 **Ecosistema Completo:** App móvil nativa y panel de administración web.

---

## ♟️ El poder detrás del nombre "Teko"

El nombre de nuestra plataforma fusiona dos conceptos culturales poderosos que definen nuestra misión:

| Idioma   | Escritura | Significado        | Simbolismo en la Arquitectura de la App                  |
|----------|-----------|--------------------|----------------------------------------------------------|
| **Guaraní**  | Teko      | *"Vida / Estilo"*  | Representa nuestra misión de mejorar el día a día y conectar a la comunidad. |
| **Japonés**  | テコ      | *"Palanca"*        | Simboliza el apalancamiento tecnológico; somos la herramienta que multiplica las oportunidades. |

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
---

## 🏗️ Arquitectura de Software y Tecnologías

El backend de TekoApp está construido bajo principios estrictos de **Clean Architecture** y **Domain-Driven Design (DDD)**. 

### Estrategia de Base de Datos Híbrida
Para garantizar un rendimiento masivo sin cuellos de botella, dividimos la persistencia:
- 🐘 **PostgreSQL (Prisma ORM):** Maneja transacciones financieras ACID, perfiles, roles y facturación.
- 🍃 **MongoDB (Mongoose):** Absorbe la telemetría pesada, *GeoTracking* (índices `2dsphere`), y logs de auditoría en tiempo real.
- ⚡ **Redis (BullMQ):** Orquesta trabajos asíncronos en segundo plano (Webhooks de pagos, notificaciones Push/SMS).

### 🚀 Ecosistema de Repositorios

| Componente       | Repositorio                                                         | Stack Tecnológico                 |
|------------------|------------------------------------------------------------------------|-----------------------------------------|
| **Backend Core** | [TekoApp-Backend](https://github.com/josepanz/TekoApp-Backend)         | NestJS, Prisma, Mongoose, Redis     |
| **Mobile App**   | [TekoApp-Mobile](https://github.com/josepanz/TekoApp-Frontend-Mobile)  | Flutter, Provider, Google Maps SDK      |
| **Web Admin**    | [TekoApp-Web](https://github.com/josepanz/TekoApp-Frontend-Web)        | React.js, Redux, Tailwind CSS           |

---

## 📂 Estructura del Backend (Desacoplamiento Estricto)

Nuestra base de código impone una frontera rígida entre la capa de red y la de persistencia:

```text
TekoApp-Backend/
├── src/
│   ├── api/           # 🌐 Capa de Orquestación (Controladores HTTP, DTOs estrictos, Swagger). No toca la BD.
│   ├── modules/       # 📦 Capa de Dominio/Persistencia (Servicios agnósticos, Prisma, llamadas a APIs externas).
│   ├── core/          # ⚙️ Configuraciones centralizadas, Middlewares, Guards, Logging (Pino).
│   └── main.ts        # 🚀 Entrypoint
├── prisma/            # 🐘 Esquemas y migraciones relacionales
└── docker-compose.yml # 🐳 Infraestructura local (Postgres, Mongo, Redis)
🔧 Instalación y Desarrollo Local (Backend)
Requisito previo: Necesitas tener instalado pnpm, Docker y Node.js 22+.
```

## 🔧 Instalación y Desarrollo Local (Backend)
#### Requisito previo: Necesitas tener instalado `pnpm`, `Docker` y `Node.js 22`.

### 1. Clonar el repositorio:
```Bash
git clone https://github.com/josepanz/TekoApp-Backend.git
cd TekoApp-Backend
```

### 2. Instalar dependencias:
```Bash
pnpm install
```

### 3. Levantar infraestructura local:
```Bash
# Levanta Postgres, MongoDB y Redis localmente
docker-compose up -d
```

### 4. Configurar el entorno (`.env`):
Crea un archivo `.env` en la raíz (usa .env.example como referencia):
```properties
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/tekoapp?schema=public"
MONGODB_URI="mongodb://localhost:27017/tekoapp_logs"
REDIS_HOST="localhost"
JWT_PRIVATE_KEY="tu_llave_rsa_privada"
...ETC
```

### 5. Generar cliente Prisma e iniciar:
```Bash
pnpm prisma generate
pnpm prisma db push
pnpm run start:dev
```

## 📦 Despliegue en Producción (Kubernetes / K3s)
TekoApp está diseñado para ser desplegado en entornos distribuidos mediante Kubernetes (K3s/K8s).

El proyecto cuenta con integración nativa de HashiCorp Vault mediante Agent Injectors para la gestión dinámica de secretos, Autoescalado Horizontal de Pods (HPA), y un pipeline CI/CD preparado para generar imágenes Docker seguras sin privilegios (non-root).

Los manifiestos `.yaml` de infraestructura se encuentran disponibles en la carpeta /ci del proyecto.

## Frontend - CONCEPT
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

### 📲 Instalación (Flutter)
#### 1. Clona el repositorio:
````bash
git clone https://github.com/josepanz/TekoApp-Frontend-Mobile.git
````

#### 2. Instala dependencias:
````bash
flutter pub get
````

#### 3. Configura las variables de entorno (lib/config/env.dart):
````env
const String API_URL = "http://localhost:3000";
const String GOOGLE_MAPS_API_KEY = "tu_api_key";
````

#### 4. Ejecuta la app:
````bash
flutter run
````

### 🌐 Instalación (Web - React.js)
#### 1. Clona el repositorio:
````bash
git clone https://github.com/josepanz/TekoApp-Frontend-Web.git
````

#### 2. Entra a la carpeta web:
````bash
cd web
````

#### 3.Instala dependencias:
````bash
pnpm install
````
#### 4. Ejecuta en desarrollo:
````bash
pnpm start
````

## 📦 Despliegue
### Backend: Usa Docker para empaquetar y desplegar en AWS/GCP:
````bash
docker-compose up --build
````
### Frontend:
#### - Flutter: Genera APK/IPA con flutter build.
#### - React.js: Despliega en Vercel/Netlify.

📢 Nota: Asegúrate de configurar correctamente las claves de API (Google Maps, Firebase) y las variables de entorno antes de desplegar.

### 🤝 Cómo Contribuir
¡Las contribuciones hacen que la comunidad de código abierto sea un lugar increíble! Si quieres mejorar TekoApp:
1. Haz un Fork del proyecto.
2. Crea tu rama funcional (git checkout -b feature/NuevaIdea).
3. Realiza tus commits respetando el linter y los tests (git commit -m 'feat: Añade NuevaIdea').
4. Sube tu rama (git push origin feature/NuevaIdea).
5. Abre un Pull Request.

**Nota para devs:** Asegúrate de correr la suite de tests unitarios y e2e (pnpm test) antes de abrir tu PR. Todo el código debe estar fuertemente tipado.

## ✉️ Contacto y Arquitectura
José Panza CEO/CTO & Tech Lead Developer & Architect & Senior Staff Engineer

- 𝕏 (Twitter): @PanzerPy
- 📧 Email: josepanza1@gmail.com