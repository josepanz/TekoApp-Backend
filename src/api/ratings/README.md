# Módulo de Ratings (Calificaciones) ⭐

Este módulo implementa un sistema completo de calificaciones bidireccional para la plataforma TekoApp, permitiendo que tanto clientes como profesionales se califiquen mutuamente.

## 🎯 Características Principales

- **Calificaciones Bidireccionales**: Clientes califican profesionales y viceversa
- **Sistema de Estrellas**: Calificaciones de 1 a 5 estrellas
- **Criterios Específicos**: Calificaciones por puntualidad, calidad, comunicación, limpieza y valor
- **Calificaciones Anónimas**: Opción para calificar de forma anónima
- **Verificación de Calificaciones**: Sistema para verificar la autenticidad
- **Reportes**: Mecanismo para reportar calificaciones inapropiadas
- **Estadísticas Avanzadas**: Cálculo de promedios y distribuciones
- **Edición Limitada**: Solo se pueden editar en las primeras 24 horas

## 🏗️ Estructura del Módulo

```
ratings/
├── entities/
│   └── rating.entity.ts          # Entidad principal de calificaciones
├── dto/
│   ├── create-rating.dto.ts      # DTO para crear calificaciones
│   ├── update-rating.dto.ts      # DTO para actualizar calificaciones
│   ├── report-rating.dto.ts      # DTO para reportar calificaciones
│   ├── rating-stats.dto.ts       # DTOs para estadísticas
│   └── index.ts                  # Exportaciones de DTOs
├── ratings.service.ts             # Lógica de negocio
├── ratings.controller.ts          # Controlador REST API
├── ratings.module.ts              # Configuración del módulo
├── ratings.service.spec.ts        # Pruebas unitarias
├── index.ts                       # Exportaciones del módulo
└── README.md                      # Esta documentación
```

## 🔧 Configuración

### 1. Importar el módulo en app.module.ts

```typescript
import { RatingsModule } from './modules/ratings/ratings.module';

@Module({
  imports: [
    // ... otros módulos
    RatingsModule,
  ],
})
export class AppModule {}
```

### 2. Configurar la base de datos

El módulo utiliza TypeORM con PostgreSQL. Asegúrate de que la entidad `Rating` esté configurada en tu base de datos.

## 📊 Entidad Rating

### Campos Principales

- **id**: Identificador único UUID
- **userId**: ID del usuario que realiza la calificación
- **professionalId**: ID del profesional calificado
- **serviceRequestId**: ID de la solicitud de servicio
- **type**: Tipo de calificación (CLIENT_TO_PROFESSIONAL o PROFESSIONAL_TO_CLIENT)
- **rating**: Calificación general (1-5 estrellas)
- **comment**: Comentario opcional
- **criteria**: Calificaciones por criterios específicos
- **isAnonymous**: Si la calificación es anónima
- **isVerified**: Si la calificación ha sido verificada
- **isReported**: Si la calificación ha sido reportada

### Criterios de Calificación

```typescript
criteria: {
  punctuality?: number;    // Puntualidad (1-5)
  quality?: number;        // Calidad del trabajo (1-5)
  communication?: number;  // Comunicación (1-5)
  cleanliness?: number;    // Limpieza (1-5)
  value?: number;          // Relación calidad-precio (1-5)
}
```

## 🚀 Endpoints de la API

### Crear Calificación
```http
POST /ratings
Authorization: Bearer <token>
Content-Type: application/json

{
  "professionalId": "uuid",
  "serviceRequestId": "uuid",
  "type": "client_to_professional",
  "rating": 5,
  "comment": "Excelente servicio",
  "criteria": {
    "punctuality": 5,
    "quality": 5,
    "communication": 4
  }
}
```

### Obtener Calificaciones de un Profesional
```http
GET /ratings/professional/{professionalId}
Authorization: Bearer <token>
```

### Obtener Estadísticas de Calificaciones
```http
GET /ratings/professional/{professionalId}/average
Authorization: Bearer <token>
```

### Obtener Profesionales Mejor Calificados
```http
GET /ratings/top-professionals?limit=10
Authorization: Bearer <token>
```

### Actualizar Calificación
```http
PATCH /ratings/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Comentario actualizado"
}
```

### Reportar Calificación
```http
POST /ratings/{id}/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Esta calificación contiene lenguaje inapropiado"
}
```

## 📈 Estadísticas y Métricas

### Calificación Promedio de Profesional
```typescript
{
  averageRating: 4.3,
  totalRatings: 100,
  ratingDistribution: {
    "1": 2, "2": 5, "3": 12, "4": 25, "5": 56
  },
  averageCriteria: {
    punctuality: 4.2,
    quality: 4.5,
    communication: 4.0,
    cleanliness: 4.3,
    value: 4.1
  }
}
```

### Estadísticas de Usuario
```typescript
{
  givenRatings: 15,
  receivedRatings: 8,
  averageGivenRating: 4.2,
  averageReceivedRating: 4.5
}
```

## 🛡️ Seguridad y Validaciones

### Reglas de Negocio

1. **Unicidad**: Solo se permite una calificación por usuario, profesional y servicio
2. **Edición Limitada**: Las calificaciones solo se pueden editar en las primeras 24 horas
3. **Eliminación Restringida**: Solo se pueden eliminar calificaciones no verificadas
4. **Reportes**: No se pueden reportar calificaciones propias
5. **Autenticación**: Todos los endpoints requieren autenticación JWT

### Validaciones

- Calificaciones deben estar entre 1 y 5 estrellas
- Criterios específicos deben estar entre 1 y 5
- Comentarios tienen límites de longitud
- Motivos de reporte deben tener entre 10 y 500 caracteres

## 🧪 Pruebas

### Ejecutar Pruebas Unitarias
```bash
npm run test ratings.service.spec.ts
```

### Cobertura de Pruebas
```bash
npm run test:cov
```

## 🔄 Flujo de Trabajo Típico

1. **Cliente solicita servicio** → Se crea ServiceRequest
2. **Profesional acepta servicio** → Se actualiza ServiceRequest
3. **Servicio se completa** → Se marca como completado
4. **Cliente califica profesional** → Se crea Rating (CLIENT_TO_PROFESSIONAL)
5. **Profesional califica cliente** → Se crea Rating (PROFESSIONAL_TO_CLIENT)
6. **Sistema calcula promedios** → Se actualizan estadísticas
7. **Calificaciones aparecen en perfiles** → Se muestran en búsquedas

## 🚨 Casos de Uso Especiales

### Calificaciones Anónimas
- Útiles para proteger la privacidad del usuario
- No afectan las estadísticas de identificación personal
- Mantienen la integridad del sistema de calificaciones

### Verificación de Calificaciones
- Sistema para detectar calificaciones falsas
- Proceso de moderación para mantener calidad
- Marcado de calificaciones verificadas

### Reportes de Calificaciones
- Mecanismo para reportar contenido inapropiado
- Proceso de revisión por moderadores
- Acciones correctivas automáticas

## 🔗 Integración con Otros Módulos

- **UsersModule**: Para obtener información de usuarios
- **ProfessionalsModule**: Para estadísticas de profesionales
- **ServicesModule**: Para validar solicitudes de servicio
- **AuthModule**: Para autenticación y autorización

## 📝 Notas de Implementación

- El módulo utiliza TypeORM para persistencia de datos
- Las consultas están optimizadas con índices de base de datos
- Se implementa paginación para listas grandes
- Las estadísticas se calculan en tiempo real
- Se mantiene consistencia de datos con transacciones

## 🚀 Mejoras Futuras

- [ ] Sistema de calificaciones por categorías de servicio
- [ ] Calificaciones con fotos/evidencia
- [ ] Sistema de recompensas por calificaciones positivas
- [ ] Análisis de sentimientos en comentarios
- [ ] Calificaciones por ubicación geográfica
- [ ] Sistema de badges y certificaciones
- [ ] Integración con redes sociales para verificación
- [ ] Calificaciones por temporada/época del año
