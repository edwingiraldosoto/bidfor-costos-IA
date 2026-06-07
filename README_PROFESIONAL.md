# BIDFOR SAS - Sistema de Gestión de Centros de Costos con IA

> **Automatización inteligente de procesos financieros mediante IA Generativa**

<div align="center">

[![GitHub license](https://img.shields.io/badge/license-Proprietary-blue.svg)]()
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg)]()

[Descripción](#descripción) • [Características](#características) • [Instalación](#instalación) • [Uso](#uso) • [Arquitectura](#arquitectura) • [Roadmap](#roadmap)

</div>

---

## Descripción

**BIDFOR** es una plataforma inteligente de control financiero que automatiza el 90% de la gestión de facturas en proyectos de consultoría pública. Utiliza **Claude API** para extraer automáticamente datos de documentos fiscales, **React** para una interfaz moderna, y **Supabase** para gestión de datos en tiempo real.

### Problema que Resuelve

En BIDFOR SAS, la gestión manual de facturas consumía **3 horas semanales** por persona, con alto riesgo de errores y cero visibilidad sobre rentabilidad real de proyectos. **BIDFOR** lo reduce a **20 minutos**, garantizando precisión y trazabilidad completa.

### Impacto Logrado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Tiempo Semanal** | 3 horas | 20 minutos | **90% ↓** |
| **Errores Manuales** | Alto riesgo | Validación IA | **99%+ precisión** |
| **Visibilidad** | Final de mes | Tiempo real | **Inmediata** |
| **Trazabilidad** | Manual | Auditoría completa | **100%** |

---

## Características Principales

### 🤖 Inteligencia Artificial
- **Extracción automática** de datos de facturas (PDF/Imagen/XML-DIAN)
- **Claude Vision API** para análisis de documentos complejos
- **Validación asistida** con control humano final (Human-in-the-Loop)
- **90% precisión** en extracción de campos críticos

### 📊 Dashboard Financiero
- **KPIs en tiempo real:** Ingresos, Costos, Ganancia, Margen %
- **Gráficos interactivos:** Distribución de costos, Estado de cartera, Comparativas
- **Alertas automáticas:** Proyectos en riesgo, Facturas vencidas
- **Visibilidad instantánea** de rentabilidad por proyecto

### 📋 Gestión de Proyectos
- **Centros de costo** con presupuesto y alertas
- **Monitoreo de consumo** presupuestal en tiempo real
- **Estados flexibles:** Activo, Pausado, Cerrado, Cancelado
- **Auditoría completa** de cambios

### 💰 Gestión de Cuentas por Pagar
- **Seguimiento de vencimientos** automático
- **Alertas proactivas** de facturas próximas a vencer
- **Historial de pagos** certificado
- **Liquidación de comisiones** justa y comprobable

### 📤 Carga en Lote
- **Procesamiento paralelo** (máximo 3 facturas simultáneas)
- **Análisis inteligente** por IA
- **Reporte detallado** de exitosas/errores
- **Excel export** de resultados

### 🔐 Seguridad y Auditoría
- **Validación humana obligatoria** antes de cada guardado
- **Auditoría completa** de quién, qué, cuándo, por qué
- **Soft delete** con opción de restauración
- **Cifrado en tránsito** (HTTPS) y en reposo
- **Backups automáticos** diarios

---

## Stack Tecnológico

### Frontend
```json
{
  "React": "19.2.6",
  "Vite": "8.0.12",
  "TailwindCSS": "3.4.19",
  "Recharts": "3.8.1",
  "Lucide React": "1.17.0"
}
```

### Backend & Data
```json
{
  "Supabase": "PostgreSQL 14+",
  "Supabase Storage": "S3-compatible",
  "Supabase Realtime": "WebSocket"
}
```

### IA & APIs
```json
{
  "Claude API": "Claude 3.5 Sonnet",
  "Claude Vision": "Para análisis de PDFs",
  "Proxy": "Node.js (CORS handling)"
}
```

### Herramientas
```json
{
  "xlsx": "Exportación a Excel",
  "papaparse": "Parseo de CSV",
  "pdfjs-dist": "Lectura de PDFs"
}
```

---

## Instalación Rápida

### Requisitos Previos

- **Node.js:** 18.0.0+
- **npm:** 9.0.0+
- **Git:** 2.30+
- **Cuenta Supabase:** [https://supabase.com](https://supabase.com)
- **API Key Claude:** [https://console.anthropic.com](https://console.anthropic.com)

### Pasos

```bash
# 1. Clonar repositorio
git clone https://github.com/bidfor-sas/bidfor-costos.git
cd bidfor-costos

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear .env.local con:
# VITE_SUPABASE_URL=https://[tu-proyecto].supabase.co
# VITE_SUPABASE_ANON_KEY=sb_publishable_[tu-key]
# ANTHROPIC_API_KEY=sk-ant-api03-[tu-key]

# 4. Cargar schema de BD
# En Supabase SQL Editor, ejecutar scripts de /database

# 5. Ejecutar en desarrollo
npm run dev

# 6. Acceder
# Frontend: http://localhost:5177
# Proxy: http://localhost:3001
```

**Para instalación detallada, ver [MANUAL_INSTALACION.md](MANUAL_INSTALACION.md)**

---

## Uso

### Caso de Uso 1: Cargar Factura Individual

```
1. Ir a Facturas → Nueva Factura
2. Seleccionar proyecto
3. Cargar PDF
4. IA extrae automáticamente
5. Validar y guardar
⏱️ Tiempo: ~2-3 minutos
```

### Caso de Uso 2: Carga Masiva

```
1. Ir a Facturas → Carga en Lote
2. Arrastrar 10-50 PDFs
3. Hacer clic "Comenzar a Procesar"
4. Esperar reporte
5. Descargar resultado en Excel
⏱️ Tiempo: ~5-10 minutos para 50 archivos
```

### Caso de Uso 3: Revisar Rentabilidad

```
1. Acceder a Dashboard
2. Ver KPIs principales
3. Revisar gráficos
4. Identificar proyectos en riesgo
5. Tomar decisiones informadas
✅ 100% datos en tiempo real
```

**Para guía completa de usuario, ver [MANUAL_USUARIO.md](MANUAL_USUARIO.md)**

---

## Arquitectura

### Diagrama General

```
┌─────────────────────────────────────────┐
│  Frontend (React + Vite)               │
│  localhost:5177                         │
└────────────────┬────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────┐
│  Proxy Server (Node.js)                │
│  localhost:3001 - CORS Handling        │
└────────────────┬────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────┐
│  Claude API (Anthropic)               │
│  Análisis de documentos                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Backend (Supabase)                    │
│  PostgreSQL + Storage + Auth           │
└─────────────────────────────────────────┘
```

### Flujo de Procesamiento

```
Carga PDF
    ↓
Análisis IA (Claude Vision)
    ↓
Extracción de datos
    ↓
Validación manual (Human-in-the-Loop)
    ↓
Upload a Storage
    ↓
Inserción en BD
    ↓
Actualización en tiempo real (Realtime)
    ↓
Dashboard actualizado
```

**Para documentación técnica completa, ver [MANUAL_TECNICO.md](MANUAL_TECNICO.md)**

---

## Estructura del Proyecto

```
bidfor-costos/
├── src/
│   ├── pages/              # Páginas principales
│   │   ├── Dashboard.jsx
│   │   ├── Facturas.jsx
│   │   ├── Proyectos.jsx
│   │   └── CuentasPorPagar.jsx
│   ├── components/         # Componentes reutilizables
│   │   ├── FacturaForm.jsx
│   │   ├── BatchFacturaUpload.jsx
│   │   └── ...
│   ├── lib/               # Lógica de negocio
│   │   ├── supabase.js
│   │   ├── analyzeFacturaPDF.js
│   │   └── ...
│   └── hooks/             # React Hooks
│
├── database/              # Migraciones SQL
│   ├── schema_simplificado.sql
│   ├── add_soft_delete_audit.sql
│   └── add_proyectos_auditoria.sql
│
├── server/                # Backend
│   └── proxy.mjs          # Proxy para Claude API
│
├── public/                # Activos estáticos
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .env.local             # Variables de entorno (no commitear)
```

---

## Modelos de Datos

### Proyectos (Centros de Costo)

```javascript
{
  id: UUID,
  numero_proyecto: string (único),
  nombre: string,
  cliente: string,
  valor_adjudicado: decimal,
  estado_id: 'activo' | 'pausado' | 'cerrado' | 'cancelado',
  alerta_porcentaje: integer (1-100),
  fecha_inicio: date,
  fecha_fin_estimada: date,
  created_at: timestamp,
  updated_at: timestamp
}
```

### Facturas

```javascript
{
  id: UUID,
  numero_factura: string,
  proveedor_id: UUID,
  proyecto_id: UUID,
  fecha_emision: date,
  fecha_vencimiento: date,
  valor_antes_iva: decimal,
  valor_iva: decimal,
  valor_retencion: decimal,
  valor_neto_pagar: decimal,
  estado_pago_id: 'pendiente' | 'pagada' | 'parcial',
  archivo_url: string,
  deleted_at: timestamp (null = activa),
  created_at: timestamp,
  updated_at: timestamp
}
```

---

## Roadmap

### ✅ Fase 1 (Completada)

- [x] Dashboard con KPIs en tiempo real
- [x] Gestión de proyectos (CRUD)
- [x] Carga de facturas con IA
- [x] Validación manual de datos
- [x] Carga en lote paralela
- [x] Auditoría completa
- [x] Exportación a Excel

### 🔄 Fase 2 (Próximas semanas)

- [ ] Integración con Google Drive (auto-ingesta)
- [ ] Alertas por WhatsApp/Email
- [ ] Gestión multi-usuario con roles de permisos
- [ ] Reportes programados
- [ ] Dashboard compartible con stakeholders

### 🚀 Fase 3 (Mediano plazo)

- [ ] Integración con ERPs (Siigo, World Office)
- [ ] Análisis predictivo de rentabilidad
- [ ] Machine Learning para detección de anomalías
- [ ] API abierta para integraciones
- [ ] Aplicación móvil (React Native)

---

## Consideraciones de Seguridad

### ✅ Implementado

- **Validación humana obligatoria** antes de cada guardado
- **Auditoría completa** de quién, qué, cuándo
- **Soft delete** con opción de restauración
- **Cifrado HTTPS** en tránsito
- **Almacenamiento seguro** de archivos en Supabase Storage
- **API Keys** en variables de entorno (no en código)

### 🔐 En Roadmap

- [ ] Autenticación multi-factor (2FA)
- [ ] Encriptación de campos sensibles
- [ ] Backup encriptado en localidad diferente
- [ ] IP whitelist para acceso
- [ ] Single Sign-On (SSO)

---

## Monitoreo y Logs

### Dashboards Recomendados

- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Dashboard:** https://vercel.com (si está deployado)
- **Claude API Usage:** https://console.anthropic.com

### Alertas

El sistema registra automáticamente:
- Errores en análisis IA
- Fallos en uploads
- Cambios de estado de facturas
- Superación de alertas presupuestales

---

## Soporte y Contribuciones

### Reportar Issues

[Crear issue en GitHub](https://github.com/bidfor-sas/bidfor-costos/issues)

Incluir:
- Descripción clara del problema
- Pasos para reproducir
- Capturas de pantalla
- Logs relevantes

### Contacto

- **Email:** soporte@bidfor.com
- **Slack:** #bidfor-soporte
- **Documentación:** [MANUAL_USUARIO.md](MANUAL_USUARIO.md)
- **API Técnico:** [MANUAL_TECNICO.md](MANUAL_TECNICO.md)

---

## Licencia

Proprietary - Derechos reservados BIDFOR SAS 2026

---

## Desarrolladores

- **Yamile Judith Ladeutt Herazo** - Backend
- **Mariluz Cano Arboleda** - Base de Datos
- **Jhaivlenne Gutierrez Figueroa** - Frontend
- **Juan Jose Peña Villa** - Frontend
- **Edwin Giraldo Soto** - Arquitectura

**Mentor:** Santiago Arredondo Vergara

Desarrollado en el **Hackathon EAFIT 2026** con apoyo de la **Beca SER ANDI 2026**.

---

## Agradecimientos

Gracias a:
- **Anthropic** por Claude API
- **Supabase** por infraestructura de BD
- **Vercel** por hosting
- **EAFIT** por el hackathon
- **SER ANDI** por la beca

---

<div align="center">

### 🚀 Hecho con ❤️ para transformar la gestión financiera

[⬆ Volver arriba](#)

</div>
