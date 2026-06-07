# MANUAL TÉCNICO - BIDFOR CENTRO DE COSTOS

---

## PORTADA

**[LOGO BIDFOR - Centro superior]**

**[LOGO BECA SER ANDI - Centro superior]**

---

# BIDFOR SAS
## Sistema Inteligente de Control Financiero por Proyecto

### Manual Técnico - Versión 1.0

**Documentación para Desarrolladores, Arquitectos y Personal de Soporte**

**Elaborado por:** Equipo Técnico BIDFOR SAS
- Edwin Giraldo Soto (Arquitectura)
- Yamile Judith Ladeutt Herazo (Backend)
- Juan Jose Peña Villa (Frontend)

**Fecha de Elaboración:** 5 de Junio de 2026

**Fecha de Última Actualización:** 6 de Junio de 2026

**Estado:** Final

---

## CONTROL DE VERSIONES

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 06/06/2026 | Documentación inicial del MVP |

---

## TABLA DE CONTENIDO

1. [Arquitectura General](#arquitectura-general)
2. [Objetivo Técnico](#objetivo-técnico)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estructura de Carpetas](#estructura-de-carpetas)
6. [Módulos y Componentes](#módulos-y-componentes)
7. [Flujo de Ejecución](#flujo-de-ejecución)
8. [APIs y Integraciones](#apis-y-integraciones)
9. [Modelo de Datos](#modelo-de-datos)
10. [Diagramas Técnicos](#diagramas-técnicos)
11. [Seguridad](#seguridad)
12. [Manejo de Errores](#manejo-de-errores)
13. [Despliegue](#despliegue)
14. [Mantenimiento](#mantenimiento)
15. [Recomendaciones Técnicas](#recomendaciones-técnicas)

---

## ARQUITECTURA GENERAL

### Descripción del Arquitectura

BIDFOR utiliza una arquitectura moderna de tres capas:

```
┌─────────────────────────────────────────────────────┐
│               CAPA DE PRESENTACIÓN                  │
│  React (Frontend) - localhost:5177                  │
│  - Componentes UI                                   │
│  - Manejo de estado                                 │
│  - Validaciones cliente                             │
└──────────────────┬──────────────────────────────────┘
                   │ HTTP/HTTPS
┌──────────────────▼──────────────────────────────────┐
│           CAPA DE INTEGRACIÓN/API                   │
│  Claude API (Anthropic)                             │
│  Proxy Server (localhost:3001)                      │
│  - Análisis de documentos                           │
│  - Extracción de datos                              │
│  - CORS handling                                    │
└──────────────────┬──────────────────────────────────┘
                   │ HTTPS
┌──────────────────▼──────────────────────────────────┐
│        CAPA DE DATOS Y SERVICIOS                    │
│  Supabase (PostgreSQL + Storage)                    │
│  - Base de datos relacional                         │
│  - Almacenamiento de archivos                       │
│  - Backups automáticos                              │
└─────────────────────────────────────────────────────┘
```

### Componentes Principales

1. **Frontend (React + Vite)**
   - Interfaz de usuario responsiva
   - Componentes reutilizables
   - Gestión de estado con hooks
   - Integración con Recharts para gráficos

2. **Backend (Supabase)**
   - PostgreSQL para datos
   - APIs REST automáticas
   - Almacenamiento de archivos
   - Autenticación

3. **Inteligencia Artificial**
   - Claude API para análisis de documentos
   - Proxy local para manejar CORS
   - Validación de campos extraídos

4. **Herramientas Auxiliares**
   - Vite: bundler de desarrollo/producción
   - Tailwind CSS: estilos
   - Lucide React: iconografía

---

## OBJETIVO TÉCNICO

**Proporcionar una plataforma escalable y segura que integre Inteligencia Artificial Generativa en procesos financieros, permitiendo automatización del 90% de tareas manuales mientras mantiene un modelo de "Human-in-the-Loop" para garantizar precisión y control.**

### Requisitos No Funcionales

- **Escalabilidad:** Soportar crecimiento de 10x sin cambios arquitectónicos
- **Disponibilidad:** 99.5% uptime (máximo 3.6 horas downtime/mes)
- **Seguridad:** Cifrado en tránsito (HTTPS) y en reposo
- **Performance:** Carga de páginas < 2 segundos
- **Mantenibilidad:** Código limpio, bien documentado, testeable
- **Interoperabilidad:** Export a Excel, integración con APIs externas

---

## TECNOLOGÍAS UTILIZADAS

### Lenguajes de Programación

- **JavaScript/TypeScript:** Lenguaje principal (frontend y algunos scripts)
- **SQL:** Queries a PostgreSQL a través de Supabase
- **PLPGSQL:** Funciones backend en Supabase

### Frameworks y Librerías Frontend

| Tecnología | Versión | Propósito |
|-----------|---------|----------|
| React | 19.2.6 | Framework UI |
| Vite | 8.0.12 | Bundler y dev server |
| Tailwind CSS | 3.4.19 | Estilos CSS |
| Recharts | 3.8.1 | Gráficos y visualización |
| Lucide React | 1.17.0 | Iconografía |

### Dependencias de Datos

| Tecnología | Propósito |
|-----------|----------|
| Supabase | Base de datos PostgreSQL |
| Supabase Storage | Almacenamiento de PDFs |
| PostGIS | Soporte para ubicaciones (futura) |

### Dependencias de IA

| Tecnología | Propósito |
|-----------|----------|
| Claude API (Anthropic) | Análisis de documentos |
| Vision de Claude | Análisis de imágenes/PDFs |

### Herramientas de Desarrollo

| Herramienta | Propósito |
|-----------|----------|
| npm | Gestor de dependencias |
| ESLint | Linting de código |
| Node.js 18+ | Runtime de JavaScript |

### Herramientas Externas

| Herramienta | Propósito |
|-----------|----------|
| XLSX | Exportación a Excel |
| Papa Parse | Parseo de CSV |
| PDF.js | Lectura de PDFs |

---

## STACK TECNOLÓGICO

### Stack Completo

```
┌─────────────────────────────────────────┐
│         PRESENTACIÓN (Frontend)         │
├─────────────────────────────────────────┤
│ React 19.2.6                            │
│ Vite 8.0.12 (Dev Server)               │
│ Tailwind CSS 3.4.19                    │
│ Recharts 3.8.1                          │
│ Lucide React 1.17.0                     │
└────────────┬────────────────────────────┘
             │ HTTP/REST
┌────────────▼────────────────────────────┐
│      INFRAESTRUCTURA (Backend)         │
├─────────────────────────────────────────┤
│ Supabase (PostgreSQL 14+)              │
│ Supabase Auth                           │
│ Supabase Storage                        │
│ Supabase Edge Functions (futuro)        │
└────────────┬────────────────────────────┘
             │ HTTPS
┌────────────▼────────────────────────────┐
│   INTELIGENCIA ARTIFICIAL              │
├─────────────────────────────────────────┤
│ Claude 3.5 Sonnet (Anthropic API)      │
│ Vision de Claude                        │
│ Proxy Local (Node.js)                   │
└─────────────────────────────────────────┘
```

### Versiones Requeridas

- **Node.js:** 18.0.0 o superior
- **npm:** 9.0.0 o superior
- **Navegadores:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **PostgreSQL:** 14.0 (gestionado por Supabase)

---

## ESTRUCTURA DE CARPETAS

```
bidfor-costos/
├── src/
│   ├── pages/                    # Páginas principales
│   │   ├── Dashboard.jsx
│   │   ├── Facturas.jsx
│   │   ├── Proyectos.jsx
│   │   └── CuentasPorPagar.jsx
│   │
│   ├── components/               # Componentes reutilizables
│   │   ├── FacturaForm.jsx
│   │   ├── FacturasList.jsx
│   │   ├── FacturaEditModal.jsx
│   │   ├── BatchFacturaUpload.jsx
│   │   ├── ProjectModal.jsx
│   │   ├── Card.jsx
│   │   ├── StatCard.jsx
│   │   └── Toast.jsx
│   │
│   ├── lib/                      # Librerías y utilidades
│   │   ├── supabase.js          # Configuración Supabase
│   │   ├── analyzeFacturaPDF.js # Análisis IA de PDFs
│   │   ├── facturaHelper.js     # Funciones de factura
│   │   ├── proveedorHelper.js   # Gestión de proveedores
│   │   ├── uploadPDF.js         # Upload a Storage
│   │   ├── queueProcessor.js    # Procesamiento en cola
│   │   ├── excelExport.js       # Exportación Excel
│   │   └── dianValidator.js     # Validación DIAN
│   │
│   ├── hooks/                    # React Hooks personalizados
│   │   ├── useRealtimeSync.js   # Sincronización en tiempo real
│   │   └── useToast.js          # Notificaciones
│   │
│   ├── App.jsx                   # Componente raíz
│   └── main.jsx                  # Punto de entrada
│
├── database/                     # Migraciones y scripts SQL
│   ├── schema_simplificado.sql   # Esquema principal
│   ├── add_soft_delete_audit.sql # Soft delete
│   └── add_proyectos_auditoria.sql # Auditoría
│
├── server/                       # Servidor backend
│   └── proxy.mjs                 # Proxy para Claude API
│
├── public/                       # Archivos estáticos
│   └── [activos varios]
│
├── vite.config.js                # Configuración Vite
├── tailwind.config.js            # Configuración Tailwind
├── postcss.config.js             # Configuración PostCSS
├── eslint.config.js              # Configuración ESLint
├── package.json                  # Dependencias
├── .env.local                    # Variables de entorno
└── README.md                     # Documentación

```

### Explicación de Directorios Clave

#### `/src/pages`
Contiene páginas completas de la aplicación. Cada página corresponde a una ruta principal.

#### `/src/components`
Componentes React reutilizables. Siguen la estructura contenedor/presentacional.

#### `/src/lib`
Lógica de negocio y utilidades. Incluyendo:
- Conexión a Supabase
- Análisis de PDFs con IA
- Helpers para operaciones CRUD
- Exportación de datos

#### `/src/hooks`
React Hooks personalizados para lógica reutilizable entre componentes.

#### `/database`
Scripts SQL para crear y modificar la base de datos. Incluye:
- Definición de tablas
- Funciones PL/pgSQL
- Triggers
- Vistas

#### `/server`
Servidor Node.js que actúa como proxy para la Claude API, manejando CORS y autenticación.

---

## MÓDULOS Y COMPONENTES

### Arquitectura de Servicios

BIDFOR implementa una arquitectura de servicios basada en **SOLID Principles** con separación clara de responsabilidades. Cada servicio tiene una función específica y comunica con otros a través de interfaces bien definidas.

---

#### Servicio de Análisis de Facturas (InvoiceAnalysisService)

**Ubicación:** `src/services/InvoiceAnalysisService.js`

**Responsabilidad:** Orquestar el flujo completo de análisis de PDFs/imágenes de facturas.

**Funcionalidades principales:**
- Validación de archivos (tipo, tamaño)
- Conversión de PDFs a imágenes base64
- Comunicación con proxy server para análisis IA
- Reintentos automáticos en caso de fallo con fallback a múltiples motores
- Validación de datos extraídos
- Extracción de JSON de respuestas en markdown

**Motores soportados:** Claude Sonnet/Opus, Gemini Pro, GPT-4o (configurable)

**Interfaz:**
```javascript
analyzeInvoice(file) → Promise<Object>
```

---

#### Servicio de Conversión de PDF (PDFConverter)

**Ubicación:** `src/services/PDFConverter.js`

**Responsabilidad:** Convertir archivos PDF a imágenes JPEG en base64, respetando límites de memoria del navegador.

**Características técnicas:**
- Manejo inteligente de PDFs grandes con escala automática
- Limitación de dimensiones de canvas (máximo 16,000px para prevenir out-of-memory)
- División en slices respetando límites API (máximo 4,000px altura por imagen)
- Calidad JPEG: 90% para balance óptimo entre calidad y tamaño

**Interfaz:**
```javascript
convert(pdfFile) → Promise<Array<string>>  // Array of base64 images
```

---

#### Servicio de Validación con Zod (ValidationSchemas)

**Ubicación:** `src/services/ValidationSchemas.js`

**Responsabilidad:** Validar datos de entrada y respuestas del API con Zod, proporcionando mensajes de error claros.

**Esquemas validados:**
- **InvoiceDataSchema:** Datos de factura extraídos (número, proveedor, fechas, valores)
- **AnalyzeInvoiceRequestSchema:** Solicitudes a proxy API
- **FileUploadSchema:** Validación de archivos cargados
- **ConfigurationSchema:** Configuración del sistema

**Enfoque pragmático:** Valida solo campos críticos necesarios (número_factura, nombre_proveedor, fecha_emision, valor_antes_iva), permite nulls para campos opcionales.

---

#### Servicio de Validación de Facturas (InvoiceValidationService)

**Ubicación:** `src/services/InvoiceValidationService.js`

**Responsabilidad:** Validar datos de facturas contra reglas de negocio.

**Validaciones:**
- Campos críticos obligatorios
- Valores positivos para montos
- Formato de fechas válido (YYYY-MM-DD)
- Coherencia entre fecha emisión y vencimiento
- Proporciones razonables (IVA < 50% de base, retención < 10% de base)

**Interfaz:**
```javascript
validate(invoiceData) → { valid: boolean, errors: string[] }
```

---

#### Factory de Proveedores de IA (APIProviderFactory)

**Ubicación:** `src/services/APIProviderFactory.js`

**Responsabilidad:** Crear instancias de proveedores IA con patrón Factory, permitiendo cambio de proveedor sin modificar código.

**Proveedores soportados:**
- **AnthropicProvider:** Implementado completamente (Claude 3.5 Sonnet, Opus)
- **GoogleGeminiProvider:** Interfaz lista para implementación
- **OpenAIProvider:** Interfaz lista para implementación

**Configuración:** Cambiar `VITE_PROVEEDOR_ID` en .env.local cambia el motor sin tocar código.

**BaseAPIProvider (interfaz):**
```javascript
sendMessage(messages, config) → Promise<Object>
validateAPIKey() → Promise<boolean>
```

---

#### Servicio de Repositorio de Facturas (InvoiceRepository)

**Ubicación:** `src/services/InvoiceRepository.js`

**Responsabilidad:** Abstraer acceso a Supabase para operaciones de facturas (patrón Repository).

**Métodos disponibles:**
- `create(facturaData)` - Insertar nueva factura
- `getById(id)` - Obtener por ID
- `getByInvoiceNumber(numero)` - Búsqueda por número
- `getByProject(projectId)` - Todas las facturas de un proyecto
- `updateStatus(id, estado)` - Cambiar estado de pago
- `exists(numero, proveedorId)` - Verificar duplicados

**Manejo de errores:** Retorna respuestas estructuradas con `{ success, data, error }`

---

#### Servicio de Almacenamiento (SupabaseStorageService)

**Ubicación:** `src/services/SupabaseStorageService.js`

**Responsabilidad:** Gestionar carga segura de archivos PDF a Supabase Storage.

**Funcionalidades:**
- Validación de tipo (solo PDF) y tamaño (máximo 50MB)
- Sanitización de paths prevención de directory traversal
- Generación de nombres seguros con timestamp
- Retorno de URLs públicas para acceso
- Manejo de errores con mensajes claros

**Bucket:** `facturas` en Supabase Storage

**Interfaz:**
```javascript
uploadFile(file, projectId) → Promise<{ url: string, path: string }>
```

---

#### Servicio de Procesamiento por Lotes (BatchProcessingService)

**Ubicación:** `src/services/BatchProcessingService.js`

**Responsabilidad:** Gestionar cola de archivos para procesamiento paralelo con límite configurable.

**Características:**
- Límite de paralelo: 3 procesos simultáneos (configurable)
- Estados de tracking: queue, processing, completed, errors
- Pub/Sub para actualizaciones de progreso en tiempo real
- Clasificación automática de errores (analysis, validation, storage, database, timeout)
- Persistencia de historial de errores para auditoría

**Métodos principales:**
```javascript
enqueue(files) → void
start() → Promise<void>
subscribe(callback) → Function  // Returns unsubscribe function
getStatus() → Object  // { queue, processing, completed, errors }
```

---

#### Servicio de Procesamiento de Facturas (FacturaProcessingService)

**Ubicación:** `src/services/FacturaProcessingService.js`

**Responsabilidad:** Orquestar pipeline completo de una factura desde archivo hasta BD.

**Pipeline completo:**
1. Análisis con IA (InvoiceAnalysisService)
2. Validación de datos (InvoiceValidationService)
3. Verificación de duplicados en BD
4. Obtención/creación de proveedor
5. Validaciones opcionales (DIAN, fechas)
6. Upload a Storage (SupabaseStorageService)
7. Inserción en BD (InvoiceRepository)

**Retorna:** Objeto completo con ID factura, número, proveedor, monto, estado DIAN, duración.

**Interfaz:**
```javascript
processInvoice(file, projectId) → Promise<Object>
```

---

#### Servicio de Logging (Logger)

**Ubicación:** `src/services/Logger.js`

**Responsabilidad:** Logging centralizado estructurado con redacción automática de datos sensibles.

**Características:**
- Niveles: DEBUG, INFO, WARN, ERROR
- Contextos jerárquicos: `createChild(name)` para tracking de componentes
- **Redacción automática:** Oculta API keys, passwords, tokens, emails automáticamente
- Salida estructurada con timestamps y contexto
- Apto para auditoría y compliance

**Ejemplo de redacción automática:**
```
Input:  "API Key: sk-ant-xxxxx, usuario: admin"
Output: "API Key: [REDACTED], usuario: [REDACTED]"
```

**Interfaz:**
```javascript
logger.info(eventName, metadata) → void
logger.warn(eventName, error, metadata) → void
logger.error(eventName, error, metadata) → void
logger.createChild(serviceName) → Logger
```

---

### Módulos Frontend

#### Módulo de Facturas

**Ubicación:** `src/pages/Facturas.jsx`

**Componentes Relacionados:**
- `FacturaForm.jsx` - Formulario de nueva factura
- `FacturaEditModal.jsx` - Modal para editar
- `FacturasList.jsx` - Tabla de listado
- `BatchFacturaUpload.jsx` - Carga en lote

**Funcionalidades:**
1. Carga de facturas individual
2. Análisis automático con IA
3. Validación manual de datos
4. CRUD completo (crear, leer, actualizar, eliminar)
5. Carga en lote paralela
6. Exportación a Excel

**Servicios utilizados:**
- `InvoiceAnalysisService` - Análisis IA
- `BatchProcessingService` - Carga en lote paralela
- `FacturaProcessingService` - Procesamiento completo

---

#### Módulo de Proyectos

**Ubicación:** `src/pages/Proyectos.jsx`

**Componentes Relacionados:**
- `ProjectModal.jsx` - Modal para crear/editar

**Funcionalidades:**
1. Listado de proyectos
2. Crear nuevos proyectos
3. Editar proyectos
4. Visualizar consumo presupuestal
5. Auditoría de cambios

**Modelo de Datos:**
```javascript
{
  id: UUID,
  numero_proyecto: string (único),
  nombre: string,
  cliente: string,
  valor_adjudicado: decimal,
  estado_id: FK(estado_proyecto),
  fecha_inicio: date,
  fecha_fin_estimada: date,
  alerta_porcentaje: integer (1-100),
  created_at: timestamp,
  updated_at: timestamp
}
```

---

#### Módulo de Dashboard

**Ubicación:** `src/pages/Dashboard.jsx`

**Visualizaciones:**
1. KPIs: Ingresos, Costos, Ganancia, Margen %
2. Alertas: Proyectos en riesgo, Facturas vencidas
3. Gráfico de Barras: Venta vs Costo vs Ganancia
4. Gráfico de Pastel: Distribución de costos
5. Gráfico de Pastel: Estado de cartera
6. Gráfico de Barras: Costos vs Ganancias por nicho

**Tecnologías:**
- Recharts para gráficos interactivos
- Cálculos en tiempo real con Supabase Realtime

---

#### Módulo de Cuentas por Pagar

**Ubicación:** `src/pages/CuentasPorPagar.jsx`

**Funcionalidades:**
1. Listado de facturas pendientes
2. Filtrado por rango de vencimiento
3. Alertas de vencimiento próximo
4. Marcado como pagadas

---

## FLUJO DE EJECUCIÓN

### Flujo 1: Cargar y Procesar Factura Individual

```
1. Usuario hace clic "Nueva Factura"
   ↓
2. Se abre modal con formulario
   - Campo proyecto_id (obligatorio)
   - Campo de carga de archivo (PDF/Imagen/XML)
   ↓
3. Usuario selecciona archivo
   ↓
4. Ejecutar: analyzeFacturaPDF(file)
   ├─ Si es PDF/Imagen:
   │  └─ Enviar a Claude Vision API
   │     ├─ Extraer: número, proveedor, NIT, valores, fechas
   │     └─ Retornar datos en JSON
   │
   └─ Si es XML-DIAN:
      └─ Parsear XML directamente
         └─ Retornar datos estructurados
   ↓
5. Prellenar formulario con datos extraídos
   ├─ Campo número_factura
   ├─ Campo proveedor (buscar o crear)
   ├─ Campo valores (base, IVA, retención)
   └─ Campo fechas
   ↓
6. Usuario revisa y valida datos
   ├─ Puede editar si hay discrepancias
   └─ Valida lógica: base > 0, fechas coherentes
   ↓
7. Usuario hace clic "Guardar"
   ├─ Validar proyecto_id existe
   ├─ Validar que factura no sea duplicada
   ├─ Uploadar PDF a Supabase Storage
   └─ Retornar archivo_url
   ↓
8. Insertar en BD:
   INSERT INTO facturas (...)
   VALUES (numero_factura, proveedor_id, proyecto_id, ...)
   ↓
9. Dashboard se actualiza en tiempo real
   (vía Supabase Realtime)
```

**Tiempo total:** ~3 minutos (vs. 5-10 minutos manual)

---

### Flujo 2: Carga en Lote

```
1. Usuario accede "Carga en Lote"
   ↓
2. Selecciona proyecto
   ↓
3. Arrastra/selecciona múltiples archivos
   ↓
4. Hace clic "Comenzar a Procesar"
   ├─ Agregar archivos a cola
   └─ Iniciar procesamiento
   ↓
5. Procesador en paralelo (máximo 3):
   ├─ Archivo 1: Análisis IA → Upload → Guardar
   ├─ Archivo 2: Análisis IA → Upload → Guardar (paralelo)
   ├─ Archivo 3: Análisis IA → Upload → Guardar (paralelo)
   └─ Cuando se completa uno, inicia el siguiente
   ↓
6. Por cada archivo:
   ├─ Mostrar progreso individual (0-100%)
   ├─ Mostrar estado actual (Analizando, Validando, Subiendo, Guardando)
   └─ Actualizar contador (Completadas, En Proceso, Pendientes, Errores)
   ↓
7. Al completar todos:
   ├─ Mostrar resumen final
   ├─ Listar exitosas vs. con errores
   └─ Opción descargar reporte Excel
```

**Tiempo total:** ~5-10 minutos (vs. 30-50 minutos manual)

---

### Flujo 3: Sincronización en Tiempo Real

```
1. Usuario A carga factura
   ↓
2. Supabase Realtime dispara evento
   ├─ Tabla: facturas
   ├─ Evento: INSERT
   └─ Payload: datos de la nueva factura
   ↓
3. Usuario B (en Dashboard) recibe notificación
   ├─ Supabase listener detecciona cambio
   ├─ useRealtimeSync hook se activa
   └─ Mostrar toast: "Nueva factura cargada"
   ↓
4. Dashboard se refresca automáticamente
   ├─ Recalcular KPIs
   ├─ Actualizar gráficos
   └─ Mostrar nueva métrica
```

**Beneficio:** Visibilidad instantánea sin refresco manual

---

## APIs Y INTEGRACIONES

### API de Supabase

**Autenticación:**
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'usuario@bidfor.com',
  password: 'password'
})
```

**CRUD de Facturas:**
```javascript
// Crear
const { data, error } = await supabase
  .from('facturas')
  .insert([datosFactura])

// Leer
const { data, error } = await supabase
  .from('facturas')
  .select('*')
  .eq('proyecto_id', proyecto_id)

// Actualizar
const { data, error } = await supabase
  .from('facturas')
  .update({ estado_pago_id: 'pagada' })
  .eq('id', factura_id)

// Soft Delete
const { data, error } = await supabase
  .from('facturas')
  .update({ deleted_at: now() })
  .eq('id', factura_id)
```

### API de Claude (Anthropic)

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Autenticación:** API Key en header `x-api-key`

**Request para Análisis de Documento:**
```javascript
{
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  temperature: 0.1,
  messages: [{
    role: "user",
    content: [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: "image/jpeg",
          data: base64EncodedImage
        }
      },
      {
        type: "text",
        text: "Extrae: número de factura, NIT, valores..."
      }
    ]
  }]
}
```

**Response:**
```json
{
  "numero_factura": "INV-2026-001",
  "nit_proveedor": "12345678-9",
  "nombre_proveedor": "Empresa XYZ",
  "valor_antes_iva": 1000000,
  "porcentaje_iva": 19,
  "valor_iva": 190000,
  "valor_retencion": 30000,
  "fecha_emision": "2026-05-20",
  "fecha_vencimiento": "2026-06-20"
}
```

### Proxy Server (Node.js)

**Puerto:** 3001

**Endpoint:** `POST /api/analyze`

**Propósito:** 
- Manejar CORS (la API de Claude no permite requests directas desde navegador)
- Agregar header de API Key de forma segura
- Loguear requests para debugging

**Flujo:**
```
Frontend → Proxy (localhost:3001) → Claude API
         ← Respuesta               ← Response
```

---

## MODELO DE DATOS

### Tabla: proyectos

```sql
CREATE TABLE proyectos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_proyecto TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  cliente TEXT NOT NULL,
  valor_adjudicado NUMERIC(15,2) NOT NULL,
  estado_id TEXT DEFAULT 'activo' REFERENCES estado_proyecto(id),
  fecha_inicio DATE,
  fecha_fin_estimada DATE,
  alerta_porcentaje INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: facturas

```sql
CREATE TABLE facturas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_factura TEXT NOT NULL,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  valor_antes_iva NUMERIC(15,2) NOT NULL,
  porcentaje_iva NUMERIC(5,2) DEFAULT 19,
  valor_iva NUMERIC(15,2) NOT NULL,
  aplica_retencion BOOLEAN DEFAULT false,
  valor_retencion NUMERIC(15,2) DEFAULT 0,
  valor_neto_pagar NUMERIC(15,2) NOT NULL,
  estado_pago_id TEXT DEFAULT 'pendiente' REFERENCES estado_pago(id),
  fecha_pago DATE,
  archivo_url TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(numero_factura, proveedor_id)
);
```

### Tabla: proveedores

```sql
CREATE TABLE proveedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nit TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: estado_pago

```sql
CREATE TABLE estado_pago (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#666666',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Valores por defecto
INSERT INTO estado_pago (id, nombre) VALUES
  ('pendiente', 'Pendiente'),
  ('pagada', 'Pagada'),
  ('parcial', 'Pago Parcial');
```

### Tabla: proyectos_auditoria

```sql
CREATE TABLE proyectos_auditoria (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  accion TEXT NOT NULL, -- 'creado', 'actualizado'
  campos_anteriores JSONB,
  campos_nuevos JSONB,
  usuario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Relaciones

```
proyectos
  ├─ estado_proyecto (1:N)
  ├─ facturas (1:N)
  └─ proyectos_auditoria (1:N)

facturas
  ├─ proveedores (N:1)
  ├─ proyectos (N:1)
  └─ estado_pago (N:1)

proveedores
  └─ facturas (1:N)
```

---

## DIAGRAMAS TÉCNICOS

### [DIAGRAMA DE ARQUITECTURA]

Debería mostrar:
- Frontend (React en localhost:5177)
- Proxy Server (Node.js en localhost:3001)
- Claude API (https://api.anthropic.com)
- Supabase (https://[proyecto].supabase.co)
- Supabase Storage
- Base de datos PostgreSQL

Con flechas bidireccionales indicando:
- HTTP REST calls
- HTTPS API calls
- WebSocket para Realtime

---

### [DIAGRAMA DE FLUJO: Procesamiento de Factura]

```
Inicio
  ↓
Usuario carga PDF → analyzeFacturaPDF()
  ↓
¿Válido?
├─ Sí → Prellenar formulario → Usuario valida → Guardar
└─ No → Mostrar error → Reintentar

Guardar
  ↓
Uploadar a Storage
  ↓
INSERT INTO facturas
  ↓
Supabase Realtime notifica
  ↓
Dashboard se actualiza
  ↓
Fin
```

---

### [DIAGRAMA DE ENTIDAD-RELACIÓN]

Debería mostrar:
- Tabla proyectos con atributos
- Tabla facturas con atributos
- Tabla proveedores con atributos
- Tabla estado_pago con valores
- Tabla proyectos_auditoria
- Relaciones 1:N, N:1 entre tablas
- Claves primarias (PK)
- Claves foráneas (FK)

---

## SEGURIDAD

### Nivel 1: Validación en Cliente

```javascript
// Validar que valor sea numérico y positivo
const valorValido = !isNaN(valor) && valor > 0

// Validar fechas coherentes
const fechasCoherentes = new Date(fechaEmision) <= new Date(fechaVencimiento)

// Validar que proyecto_id existe
const proyectoExiste = proyectos.some(p => p.id === proyecto_id)
```

### Nivel 2: Validación en Servidor (Supabase)

```sql
-- Constraints en BD
ALTER TABLE facturas ADD CONSTRAINT chk_valor_positivo
  CHECK (valor_antes_iva > 0);

ALTER TABLE facturas ADD CONSTRAINT chk_fechas_coherentes
  CHECK (fecha_vencimiento >= fecha_emision);

-- Índices para performance
CREATE INDEX idx_facturas_proyecto ON facturas(proyecto_id);
CREATE INDEX idx_facturas_vencimiento ON facturas(fecha_vencimiento)
  WHERE estado_pago_id = 'pendiente';
```

### Nivel 3: Autenticación y Autorización

```javascript
// Usar Supabase Auth
const usuario = await supabase.auth.getUser()

// Validar que usuario tenga permiso para el proyecto
const tienePermiso = usuarioPermisos.includes(proyecto_id)
```

### Nivel 4: Cifrado en Tránsito

- Todas las conexiones a Supabase usan HTTPS
- Todas las solicitudes a Claude API usan HTTPS
- API Keys se almacenan en variables de entorno (.env.local)
- API Keys NO se commitean en git

### Nivel 5: Auditoría

```sql
-- proyectos_auditoria registra todos los cambios
- Quién cambió (usuario)
- Qué cambió (campos_anteriores, campos_nuevos)
- Cuándo (created_at)
- Por qué (razon)
```

### Nivel 6: Validación Humana

**Human-in-the-Loop:**
- IA extrae datos
- **Usuario SIEMPRE revisa y confirma**
- Eliminación marcada (soft delete, se puede restaurar)
- Cambios en auditoría

---

## MANEJO DE ERRORES

### Errores en Análisis de PDF

```javascript
try {
  const datos = await analyzeFacturaPDF(file)
} catch (err) {
  if (err.message.includes('API')) {
    // Plan B: Carga manual
    showMessage('La IA no está disponible. Por favor, ingresa datos manualmente')
  } else if (err.message.includes('formato')) {
    showError('El formato de archivo no es soportado')
  } else {
    showError('Error analizando el documento: ' + err.message)
  }
}
```

### Errores en Upload a Storage

```javascript
try {
  const { data, error } = await uploadFacturaPDF(file)
  if (error) throw error
} catch (err) {
  if (err.message.includes('size')) {
    showError('Archivo muy grande. Máximo 50MB')
  } else if (err.message.includes('storage')) {
    showError('Error de almacenamiento. Intenta nuevamente')
  }
}
```

### Errores en Inserción a BD

```javascript
try {
  const { error } = await supabase
    .from('facturas')
    .insert([datosFactura])
  if (error) throw error
} catch (err) {
  if (err.message.includes('UNIQUE')) {
    showError('Esta factura ya existe')
  } else if (err.message.includes('FK')) {
    showError('El proveedor o proyecto no existe')
  } else {
    showError('Error guardando: ' + err.message)
  }
}
```

---

## DESPLIEGUE

### Ambiente Local (Desarrollo)

**Requisitos:**
- Node.js 18+
- npm 9+
- Cuenta Supabase con DB criada

**Pasos:**

1. Clonar repositorio
```bash
git clone https://github.com/bidfor-sas/bidfor-costos.git
cd bidfor-costos
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
# .env.local
VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_[tu-key]
```

4. Ejecutar ambos servicios
```bash
npm run dev
# Abre:
# - Frontend en http://localhost:5177
# - Proxy en http://localhost:3001
```

### Ambiente Producción (Deployment)

**En Vercel (Recomendado para Frontend):**

1. Conectar repositorio GitHub a Vercel
2. Configurar variables de entorno
3. Build se ejecuta automáticamente: `npm run build`
4. Deploy a https://bidfor-costos.vercel.app

**Backend (Supabase) - Ya gestionado:**
- PostgreSQL en la nube
- Backups automáticos diarios
- SSL/TLS incluido
- Escalabilidad automática

---

## MANTENIMIENTO

### Monitoreo

**Dashboards a revisar:**
- Supabase: https://app.supabase.com
  - Storage usage
  - Database stats
  - Edge Function logs
  
- Vercel: https://vercel.com/dashboard
  - Deployment logs
  - Error tracking
  - Performance metrics

### Actualizaciones Regulares

**Semanal:**
- Revisar logs de errores
- Validar backups de BD
- Revisar performance

**Mensual:**
- Actualizar dependencias menores (`npm update`)
- Revisar alertas de seguridad (`npm audit`)
- Analizar métricas de uso

**Trimestral:**
- Actualizar dependencias mayores
- Revisar arquitectura
- Optimizaciones de performance

### Plan de Disaster Recovery

**Si Supabase está caído:**
1. Activar modo offline en BD local
2. Guardar cambios en LocalStorage
3. Sincronizar cuando DB vuelva

**Si Claude API está caída:**
1. Mostrar formulario para entrada manual
2. Usuario completa datos a mano
3. Sistema funciona con degradación

---

## RECOMENDACIONES TÉCNICAS

### Para Próximas Versiones

**Fase 2:**
1. **Caching inteligente**
   - Redis para cache de proyectos
   - Reduce latencia en dashboard

2. **Background Jobs**
   - Bull Queue para procesar archivos
   - No bloquea UI mientras procesa

3. **Webhooks**
   - Google Drive auto-ingesta
   - Integraciones con contabilidad

**Fase 3:**
1. **Database Optimization**
   - Particionamiento de facturas por año
   - Índices para queries complejas
   - Materialized views para reportes

2. **Analytics Avanzado**
   - Predictive analytics con ML
   - Forecasting de rentabilidad
   - Anomaly detection

3. **Integraciones ERP**
   - Sincronización con Siigo
   - Sincronización con World Office
   - API abierta para terceros

### Consideraciones Arquitectónicas

**Escalabilidad:**
- Frontend: Vercel escala automáticamente
- Backend: Supabase escala automáticamente
- Considerar CDN global para PDFs muy grandes

**Seguridad:**
- Implementar 2FA para usuarios administrativos
- Auditoría más detallada de cambios
- Backup encriptado en localidad diferente

**Performance:**
- Lazy loading de gráficos grandes
- Virtualization para tablas > 10K filas
- Compresión de imágenes antes de upload

---

**Documento Finalizado:** 6 de Junio de 2026
**Vigencia:** Mientras no se indique actualización
**Próxima Revisión:** Diciembre de 2026
