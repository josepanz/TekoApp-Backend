# memory.md — tekoapp-backend

> Sistema de memoria para sesiones de Claude en este proyecto.
> Al iniciar, leer: `documentation/context.md` + última sesión en `memory/sessions/`.

---

## Protocolo de inicio de sesión

Al comenzar cualquier sesión:

1. **Leer `documentation/context.md`** — estado actual del proyecto, stack, decisiones, pendientes
2. **Leer la sesión más reciente** en `memory/sessions/` (ordenar por nombre, tomar la última)
3. Confirmar: _"Retomando desde [resumen de 1 línea de dónde quedamos]"_
4. Si no existen esos archivos, crearlos con estructura vacía

---

## Protocolo de cierre de sesión

Cuando el usuario diga **"guarda sesión"** o **"compact"**:

Crear o actualizar `memory/sessions/session_N_user_accion.md` donde:

- `N` = número de sesión (incrementar del último existente)
- `user` = usuario que realizo sesión para no pisar los números de session por usuario ya que varios developers trabajan en el mismo proyecto
- `accion` = slug 2-3 palabras de lo hecho (ej: `auth_jwt`, `fix_payments`, `refactor_users`)

Si no lo dice y cierra la sesión/chat tanto en claude code desktop como la extension vscode, se proactivo y ejecuta el guardado tu.

También, proactivamente aprende de los errores y soluciones aplicadas para cada sesión para no volver a cometerlas o saber como solucionarlas, si es posible, al codificar ya saber que evitar y ajusta y mejoras las reglas mientras vas iterando.

Se proactivo y evalua y reordena (mueve los archivos viejos) las sesiones antiguas (> 5 sesiones atrás) → archivar en `memory/sessions/archive/` crear si no existe la carpeta `memory/sessions/archive/` y mueve los archivos viejos alli.

```markdown
# Sesión N — [Fecha] — [Descripción breve]

## Qué se hizo

- [Lista de cambios realizados]

## Decisiones tomadas

- [Por qué X sobre Y]

## Archivos modificados

- `ruta/archivo.ext` — descripción del cambio

## Próximos pasos

- [ ] Tarea pendiente 1
- [ ] Tarea pendiente 2

## Estado al cerrar

[1-2 líneas describiendo en qué punto quedó todo]
```

---

## Triggers automáticos

| Trigger                     | Acción                                                          |
| --------------------------- | --------------------------------------------------------------- |
| "nueva regla: ..."          | Agregar a `rules/*.md` correspondiente                          |
| "recuerda que siempre..."   | Agregar a `rules/*.md`                                          |
| "corrige esto..."           | Agregar corrección a `rules/*.md`                               |
| "guarda sesión" / "compact" | Crear archivo de sesión + actualizar `documentation/context.md` |
| "¿qué hicimos?"             | Leer y resumir la última sesión                                 |
| "¿dónde quedamos?"          | Leer `documentation/context.md` + última sesión y responder     |

---

## Estructura de archivos de memoria

```
.claude/
├── CLAUDE.md                   ← dominio + arquitectura + reglas críticas
├── agents/                     ← definición de agentes especializados
├── rules/                      ← reglas por categoría (infra, typescript, test)
├── documentation/
│   ├── context.md              ← estado vivo del proyecto (actualizar por sesión)
│   └── manual-tdd-sdd.md       ← manual de referencia (no se carga automáticamente)
└── memory/
    ├── memory.md               ← este archivo: protocolo de memoria
    └── sessions/               ← historial de sesiones (session_N_accion.md)
        └── archive/              ← historial de sesiones viejas, menores a 5 sesiones anteriores
```

---

## Economía de tokens

- Se proactivo y guarda las Sesiones antiguas (> 5 sesiones atrás) → archivar en `memory/sessions/archive/`
- `context.md` no debe superar 150 líneas — resumir agresivamente
- Al hacer "compact": resumir historial en la sesión y limpiar lo redundante
- Nunca copiar código completo en archivos de sesión — solo referencias a archivos y cambios
