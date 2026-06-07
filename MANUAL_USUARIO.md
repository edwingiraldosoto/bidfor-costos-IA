# MANUAL DE USUARIO - BIDFOR CENTRO DE COSTOS

---

## PORTADA

**[LOGO BIDFOR - Centro superior]**

**[LOGO BECA SER ANDI - Centro superior]**

---

# BIDFOR SAS
## Sistema Inteligente de Control Financiero por Proyecto

### Manual de Usuario - Versión 1.0

**Elaborado por:** Equipo de Desarrollo BIDFOR SAS
- Yamile Judith Ladeutt Herazo
- Mariluz Cano Arboleda
- Jhaivlenne Gutierrez Figueroa
- Juan Jose Peña Villa
- Edwin Giraldo Soto

**Mentor:** Santiago Arredondo Vergara

**Fecha de Elaboración:** 5 de Junio de 2026

**Fecha de Última Actualización:** 6 de Junio de 2026

**Estado:** Final

---

## CONTROL DE VERSIONES

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 06/06/2026 | Equipo BIDFOR | Documento inicial |

---

## TABLA DE CONTENIDO

1. [Introducción](#introducción)
2. [Objetivo del Sistema](#objetivo-del-sistema)
3. [Alcance](#alcance)
4. [Público Objetivo](#público-objetivo)
5. [Requisitos para Acceder](#requisitos-para-acceder)
6. [Descripción General de la Solución](#descripción-general-de-la-solución)
7. [Módulos del Sistema](#módulos-del-sistema)
8. [Guía de Uso por Funcionalidad](#guía-de-uso-por-funcionalidad)
9. [Casos de Uso Principales](#casos-de-uso-principales)
10. [Preguntas Frecuentes](#preguntas-frecuentes)
11. [Solución de Problemas](#solución-de-problemas)
12. [Glosario de Términos](#glosario-de-términos)
13. [Conclusiones](#conclusiones)

---

## INTRODUCCIÓN

BIDFOR SAS es una consultora especializada en estrategias públicas que requiere una gestión financiera de alta precisión. Este documento detalla cómo utilizar el **Sistema de Gestión de Centros de Costos BIDFOR**, una solución integral que automatiza el ciclo completo de control financiero mediante Inteligencia Artificial Generativa.

El sistema representa una transformación de procesos manuales que consumían 3 horas semanales a un flujo automatizado que reduce este tiempo a aproximadamente 20 minutos, mejorando simultáneamente la precisión y la visibilidad financiera.

---

## OBJETIVO DEL SISTEMA

El objetivo principal de BIDFOR es:

**Automatizar la gestión completa de facturas y centros de costos, proporcionando visibilidad financiera en tiempo real mediante Inteligencia Artificial, permitiendo a la organización tomar decisiones informadas sobre la rentabilidad de sus proyectos.**

### Objetivos Específicos:

- ✅ Reducir el tiempo de procesamiento de facturas en un 90%
- ✅ Eliminar errores manuales en la digitación de datos financieros
- ✅ Proporcionar visibilidad inmediata sobre la rentabilidad por proyecto
- ✅ Automatizar alertas sobre facturas vencidas y consumo presupuestal
- ✅ Facilitar la liquidación oportuna de comisiones al equipo comercial
- ✅ Mejorar la trazabilidad de costos para cumplimiento normativo
- ✅ Fortalecer las relaciones con proveedores mediante pagos oportunos

---

## ALCANCE

### Funcionalidades Incluidas en la Versión 1.0:

#### Módulo de Facturas
- Carga automática de facturas (PDF/Imagen/XML-DIAN)
- Extracción inteligente de datos con Claude AI
- Validación manual de datos extraídos
- Gestión de proveedores (crear/editar)
- Visualización de facturas por proyecto
- Marcado de facturas como pagadas
- Eliminación suave (soft delete) con auditoría

#### Módulo de Proyectos
- Creación y gestión de centros de costos
- Definición de presupuesto y alertas
- Visualización de consumo presupuestal
- Estados de proyecto (Activo, Pausado, Cerrado, Cancelado)
- Auditoría de cambios en proyectos

#### Dashboard Financiero
- Resumen de ingresos totales
- Resumen de costos totales
- Cálculo de ganancia total y margen porcentual
- Alertas de proyectos en riesgo
- Visualización gráfica de distribución de costos
- Estado de cartera (vencidas, próximas a vencer, por pagar)

#### Módulo de Cuentas por Pagar
- Visualización de facturas pendientes
- Filtrado por proyecto y estado
- Alertas de vencimiento
- Reportes exportables a Excel

#### Carga en Lote
- Procesamiento simultáneo de múltiples facturas
- Análisis con IA en paralelo (máximo 3 concurrentes)
- Reporte detallado de exitosas y errores
- Descarga de reporte en Excel

### Funcionalidades No Incluidas (Fase 2+):

- Integración con Google Drive para ingesta automática
- Alertas por WhatsApp/Email
- Gestión multi-usuario con roles de permisos avanzados
- Integración con ERPs (Siigo, World Office)
- Análisis predictivo de rentabilidad

---

## PÚBLICO OBJETIVO

Este sistema está diseñado para tres usuarios principales:

### 1. **Equipo Administrativo-Financiero**
- **Responsables:** Gestionar la carga y validación de facturas
- **Beneficio:** Reduce su carga operativa de 3 horas a 20 minutos semanales
- **Acciones principales:** Carga de facturas, validación de datos, marcado como pagadas

### 2. **Equipo Comercial**
- **Responsables:** Monitorear comisiones basadas en rentabilidad
- **Beneficio:** Acceso a datos precisos de utilidad real por proyecto
- **Acciones principales:** Visualizar reportes, solicitar exportes a Excel

### 3. **Dirección/Gerencia**
- **Responsables:** Toma de decisiones estratégicas
- **Beneficio:** Visibilidad inmediata sobre margen, rentabilidad y riesgos
- **Acciones principales:** Consultar dashboard, identificar proyectos en alerta

---

## REQUISITOS PARA ACCEDER

### Técnicos:

1. **Navegador Web Compatible**
   - Chrome 90+
   - Firefox 88+
   - Safari 14+
   - Edge 90+

2. **Conexión a Internet**
   - Mínimo 2 Mbps
   - Conexión estable requerida para carga de archivos

3. **Almacenamiento**
   - Mínimo 100MB disponible para caché de navegador

### Funcionales:

1. **Credenciales de Acceso**
   - URL del sistema: `http://localhost:5177` (desarrollo local)
   - Usuario y contraseña asignados por administrador

2. **Permisos de Sistema**
   - Acceso a módulo correspondiente según rol
   - Permisos para carga de archivos PDF/Imagen

3. **Archivos de Entrada**
   - Facturas en formato PDF
   - Facturas en formato imagen (JPG, PNG, WebP)
   - Facturas XML-DIAN

---

## DESCRIPCIÓN GENERAL DE LA SOLUCIÓN

### ¿Qué es BIDFOR?

BIDFOR es una plataforma inteligente que automatiza la gestión financiera de centros de costos mediante dos componentes principales:

#### 1. Motor de IA Generativa
- **Tecnología:** Claude API (Anthropic)
- **Función:** Analiza facturas y extrae automáticamente
  - Número de factura
  - Datos del proveedor (Nombre, NIT)
  - Fechas (emisión, vencimiento)
  - Valores (base, IVA, retenciones)
  - Datos validados

#### 2. Plataforma de Control Financiero
- **Interfaz:** Dashboard intuitivo con React
- **Base de Datos:** Supabase (PostgreSQL en la nube)
- **Funcionalidad:** Gestión de proyectos, facturas, reportes y análisis

### Flujo Operativo Principal:

```
USUARIO CARGA PDF
         ↓
    [EXTRACCIÓN IA]
    Claude analiza documento
         ↓
[VALIDACIÓN MANUAL]
Usuario revisa y confirma
         ↓
[VINCULACIÓN A PROYECTO]
Sistema actualiza centro de costos
         ↓
[DASHBOARD EN TIEMPO REAL]
Métricas actualizadas automáticamente
```

### Ventajas Principales:

| Antes (Manual) | Después (BIDFOR) |
|---|---|
| 3 horas semanales | 20 minutos semanales |
| 100% manual | 90% automatizado |
| Alto riesgo de errores | Validación asistida por IA |
| Visibilidad nula | Dashboard en tiempo real |
| Pago atrasado a proveedores | Alertas de vencimiento |

---

## MÓDULOS DEL SISTEMA

### 1. **Dashboard** - Visión Estratégica

El Dashboard es la pantalla principal que consolida toda la información financiera de la empresa.

**Componentes:**

- **KPI: Total Ingresos**
  - Suma de todos los valores adjudicados en proyectos activos
  - Muestra cantidad de proyectos

- **KPI: Total Costos**
  - Suma de todas las facturas procesadas
  - Porcentaje respecto a ingresos

- **KPI: Ganancia Total**
  - Diferencia: Ingresos - Costos
  - Color rojo si es negativo, verde si es positivo

- **KPI: Margen %**
  - Ganancia / Ingresos * 100
  - Indicador de rentabilidad general

- **Alertas de Proyectos en Riesgo**
  - Muestra proyectos que superan su alerta presupuestal
  - Ejemplo: "Proyecto X - 85% consumido"

- **Alertas de Facturas Vencidas**
  - Cantidad de facturas pendientes que vencieron
  - Llamada a la acción para revisión

- **Gráfico: Venta vs Costo vs Ganancia**
  - Comparativo por proyecto
  - Fácil identificación de proyectos problemáticos

- **Gráfico: Distribución de Costos**
  - Pastel mostrando qué proyectos consumen más
  - Leyenda con montos exactos

- **Gráfico: Estado de Cartera**
  - Pastel con: Vencidas, Próximas a Vencer, Por Pagar
  - Proporciones visuales

- **Gráfico: Costos vs Ganancias por Nicho/Cliente**
  - Análisis por área de negocio

[CAPTURA DE PANTALLA: Dashboard Principal con todos los gráficos y KPIs]

### 2. **Facturas** - Gestión Documental

El módulo de Facturas es donde se cargan, validan y gestionan todos los documentos fiscales.

**Secciones:**

#### Sección Superior - Resumen Rápido
- **Por Pagar:** Total de facturas pendientes que NO han vencido
- **Vencidas:** Total de facturas que pasaron su fecha de vencimiento
- **Centros de Costo:** Total de proyectos activos

#### Acciones Disponibles
- **Descargar Excel:** Exporta todas las facturas a hoja de cálculo
- **Carga en Lote:** Procesa múltiples facturas simultáneamente con IA
- **Nueva Factura:** Carga manual de una factura individual

#### Filtros
- **Proyecto:** Filtrar por centro de costos específico
- **Estado:** Pendiente, Pagada, Pago Parcial, Todas
- **Ver Eliminadas:** Mostrar facturas marcadas como eliminadas

#### Tabla de Facturas
Columnas mostradas:
- **Factura:** Número identificador
- **Proveedor:** Nombre y NIT del proveedor
- **Proyecto:** Centro de costos asociado
- **Valor Base:** Antes de impuestos
- **IVA:** Impuesto al Valor Agregado
- **Retención:** Descuentos aplicables
- **Total:** Valor neto a pagar
- **Vencimiento:** Fecha de vencimiento
- **Estado:** Pendiente/Pagada/Parcial (con color)
- **Acciones:** Botones para descargar PDF, editar, pagar, eliminar

[CAPTURA DE PANTALLA: Lista de Facturas con todos los campos]

### 3. **Proyectos** - Centros de Costo

Este módulo gestiona todos los proyectos/centros de costos de la empresa.

**Funcionalidades:**

- **Listado de Proyectos**
  - Número único del proyecto
  - Nombre y cliente
  - Valor adjudicado (presupuesto)
  - Estado (Activo, Pausado, Cerrado, Cancelado)
  - Barra de consumo presupuestal
  - Porcentaje consumido vs valor adjudicado

- **Crear Nuevo Proyecto**
  - Campos: Número, Nombre, Cliente, Valor Adjudicado
  - Fechas: Inicio y Fin Estimada
  - Alerta: Porcentaje cuando activar alerta (default 80%)
  - Estado inicial: Activo

- **Editar Proyecto**
  - Modificar cualquier campo excepto número (inmutable)
  - Auditoría de cambios registrada
  - Historial de cambios disponible

- **Barras de Consumo**
  - Verde: 0-79% (normal)
  - Amarillo: 80-99% (alerta)
  - Rojo: 100%+ (crítico)

[CAPTURA DE PANTALLA: Listado de Proyectos con barras de consumo]

### 4. **Cuentas por Pagar** - Gestión de Vencimientos

Módulo especializado para el seguimiento de obligaciones financieras.

**Secciones:**

- **Cartera por Vencer**
  - Próximas a vencerse (1-3 días)
  - Acciones inmediatas recomendadas

- **Cartera Vencida**
  - Facturas pasadas de vencimiento
  - CRÍTICO: Requiere atención inmediata

- **Cartera Normal**
  - Facturas por pagar dentro del plazo

- **Filtros Disponibles**
  - Por proyecto
  - Por rango de fechas
  - Por proveedor

- **Acciones**
  - Marcar como pagada
  - Generar recordatorio
  - Descargar comprobante

[CAPTURA DE PANTALLA: Cuentas por Pagar con alertas destacadas]

---

## GUÍA DE USO POR FUNCIONALIDAD

### FLUJO 1: Cargar una Factura Individual

**Paso 1:** Acceder al módulo de Facturas
- En el menú lateral, hacer clic en "Facturas"

**Paso 2:** Hacer clic en "Nueva Factura"
- Aparecerá un modal/formulario de carga

**Paso 3:** Seleccionar el Proyecto
- Dropdown: "Selecciona un proyecto"
- Elegir el centro de costos correspondiente

**Paso 4:** Cargar el archivo
- Hacer clic en "Seleccionar Archivos"
- Formatos aceptados: PDF, JPG, PNG, WebP, XML-DIAN

**Paso 5:** IA Extrae Automáticamente
- El sistema analiza la factura con Claude
- Prellencha campos: Número, Proveedor, NIT, Valores, Fechas

**Paso 6:** Validar Datos
- Revisar cada campo
- Editar si hay discrepancias
- IMPORTANTE: La IA sugiere, pero TÚ confirmas

**Paso 7:** Completar Información Manual
- Verificar proyecto asignado
- Ingresar notas si aplica

**Paso 8:** Guardar
- Hacer clic en "Guardar Factura"
- Confirmación: "✨ ¡Factura guardada exitosamente!"

**Tiempo estimado:** 2-3 minutos (vs. 5-10 minutos manual)

[CAPTURA DE PANTALLA: Formulario de Nueva Factura con campos prellenados]

---

### FLUJO 2: Carga en Lote (Múltiples Facturas)

**Paso 1:** Acceder a "Carga en Lote"
- En Facturas → "Carga en Lote"

**Paso 2:** Seleccionar Proyecto
- El proyecto aplica para todos los PDFs que subas

**Paso 3:** Arrastra o Selecciona Archivos
- Puedes arrastrar archivos al área punteada
- O hacer clic "Seleccionar Archivos"
- Soporta múltiples formatos

**Paso 4:** Comenzar a Procesar
- Botón verde: "Comenzar a Procesar"
- Sistema procesa máximo 3 facturas en paralelo

**Paso 5:** Monitoreo en Tiempo Real
- **Pantalla de Progreso:**
  - Barra de progreso general (0-100%)
  - Contador: Completadas | En Proceso | Pendientes | Errores
  - Por cada archivo:
    - Barra individual de progreso
    - Estado actual: 🔍 Analizando / ✓ Validando / 📤 Subiendo / 💾 Guardando

**Paso 6:** Resultados Finales
- Total de archivos procesados
- Cargadas exitosamente (número)
- Con errores (número)
- Tasa de éxito (porcentaje)

**Paso 7:** Revisar Errores (si aplica)
- Lista detallada de archivos con problemas
- Motivo específico del error
- Acciones recomendadas

**Paso 8:** Descargar Reporte
- Botón: "Descargar Reporte"
- Excel con: Resumen, Exitosas, Errores, Guía

[CAPTURA DE PANTALLA: Pantalla de Carga en Lote con progreso visual]

---

### FLUJO 3: Marcar Factura como Pagada

**Paso 1:** Acceder a Facturas
- Menú → Facturas
- O ir a "Cuentas por Pagar"

**Paso 2:** Localizar la Factura
- Usar filtros si es necesario
- O buscar en la tabla

**Paso 3:** Hacer clic en Botón "Pagar"
- Botón verde con símbolo de checkmark
- Aparece en la columna "Acciones"

**Paso 4:** Confirmar Pago
- Sistema solicita confirmación
- Registra fecha de pago automáticamente

**Paso 5:** Verificar Cambio de Estado
- El estado cambia de "Pendiente" a "Pagada"
- Se marca con checkmark verde
- Se quita de alertas de vencimiento

**Resultado:** 
- Dashboard actualiza automáticamente
- Cartera se recalcula
- Comisiones se pueden liquidar

[CAPTURA DE PANTALLA: Tabla de facturas con botón Pagar destacado]

---

### FLUJO 4: Crear un Nuevo Proyecto

**Paso 1:** Ir a Módulo Proyectos
- Menú lateral → "Proyectos"

**Paso 2:** Hacer clic en "Nuevo Proyecto"
- Botón naranja con símbolo +

**Paso 3:** Completar Formulario

**Campos Obligatorios:**
- **Número de Proyecto:** Identificador único (ej: P-2026-001)
- **Nombre:** Descripción del proyecto
- **Cliente:** Entidad contratante
- **Valor Adjudicado:** Presupuesto total (en pesos)

**Campos Opcionales:**
- **Descripción:** Detalles adicionales
- **Fecha Inicio:** Cuándo inicia
- **Fecha Fin Estimada:** Cuándo termina
- **Alerta Porcentaje:** % de consumo para alerta (default 80%)

**Paso 4:** Guardar Proyecto
- Botón "Crear Proyecto"
- Confirmación inmediata

**Paso 5:** Verificar en Listado
- Proyecto aparece en la tabla
- Estado inicial: "Activo"
- Barra de consumo en 0%

[CAPTURA DE PANTALLA: Formulario de Nuevo Proyecto]

---

### FLUJO 5: Editar un Proyecto Existente

**Paso 1:** Ir a Proyectos
- Menú → Proyectos

**Paso 2:** Localizar el Proyecto
- En la tabla de proyectos

**Paso 3:** Hacer clic en Botón "Editar"
- Icono de lápiz en la columna Acciones

**Paso 4:** Modificar Campos
- NOTA: "Número de Proyecto" NO se puede cambiar (inmutable)
- Otros campos sí pueden editarse

**Paso 5:** Guardar Cambios
- Botón "Guardar Cambios"

**Paso 6:** Auditoría
- Los cambios se registran automáticamente
- Se puede ver historial de quién cambió qué y cuándo

[CAPTURA DE PANTALLA: Modal de Edición de Proyecto]

---

### FLUJO 6: Consultar el Dashboard

**Paso 1:** Acceder al Dashboard
- Menú → "Dashboard" (primera opción)

**Paso 2:** Revisar KPIs Principales
- **Ingresos:** ¿Cuánto presupuesto total tengo?
- **Costos:** ¿Cuánto he gastado?
- **Ganancia:** ¿Cuál es mi utilidad?
- **Margen:** ¿Qué porcentaje es ganancia?

**Paso 3:** Revisar Alertas
- ¿Hay proyectos en riesgo?
- ¿Hay facturas vencidas?
- → Tomar acciones correctivas

**Paso 4:** Analizar Gráficos
- **Venta vs Costo:** ¿Qué proyecto es más rentable?
- **Distribución de Costos:** ¿Dónde estoy gastando más?
- **Cartera:** ¿Cuánto debo y cuándo?

**Paso 5:** Tomar Decisiones
- Basadas en datos precisos
- En tiempo real
- Información verificada

[CAPTURA DE PANTALLA: Dashboard completo con todos los gráficos]

---

### FLUJO 7: Exportar Reporte a Excel

**Paso 1:** Ir a Facturas
- Menú → Facturas

**Paso 2:** Hacer clic en "Descargar Excel"
- Botón negro con símbolo de descarga
- En la parte superior

**Paso 3:** Esperar Descarga
- El archivo se genera automáticamente
- Nombre: "BidFor-Costos-[fecha].xlsx"

**Paso 4:** Abrir en Excel/Spreadsheet
- El archivo contiene todas las facturas
- Formatos: Número, Proveedor, Proyecto, Valores, Fechas, Estados

**Paso 5:** Usar para Auditoría
- Validar datos
- Hacer análisis adicionales
- Enviar a contador si aplica

**Ventaja:** Puedes filtrar, ordenar y analizar en Excel sin salir de la plataforma

[CAPTURA DE PANTALLA: Botón Descargar Excel en Facturas]

---

## CASOS DE USO PRINCIPALES

### Caso de Uso 1: Liquidación de Comisiones al Equipo Comercial

**Escenario:** El equipo comercial debe recibir comisiones basadas en la utilidad real de los proyectos.

**Proceso Antes de BIDFOR:**
1. Esperar cierre contable (final de mes)
2. Contador calcula manualmente
3. 3-5 días de retraso
4. Alta probabilidad de errores

**Proceso Con BIDFOR:**
1. ✅ Acceder a Dashboard
2. ✅ Ver margen por proyecto en TIEMPO REAL
3. ✅ Exportar a Excel en 2 clics
4. ✅ Liquidar comisiones al día
5. ✅ Datos certificados por IA + validación humana

**Resultado:** Comisiones justas, oportunas y comprobables.

---

### Caso de Uso 2: Identificar Proyecto en Riesgo

**Escenario:** Un proyecto ha consumido el 95% de su presupuesto y aún quedan facturas pendientes.

**Detección en BIDFOR:**
1. Dashboard muestra alerta roja
2. "Proyecto X - 95% consumido"
3. Al hacer clic, ve todas las facturas
4. Suma valores pendientes
5. Realiza análisis: "Si estas facturas se pagan, seremos deficitarios"

**Acción Inmediata:**
- Contactar cliente para ampliación presupuestal
- Suspender gastos no esenciales
- Reasignar recursos

**Beneficio:** Evitar que un proyecto se vuelva deficitario antes de darse cuenta.

---

### Caso de Uso 3: Gestión de Proveedores para Pagos Oportunos

**Escenario:** Mejorar relaciones con proveedores mediante pagos a tiempo.

**Flujo:**
1. Factura cargada y validada
2. Aparece en "Cuentas por Pagar"
3. Alerta de vencimiento (3 días antes)
4. Equipo administrativo actúa proactivamente
5. Factura se marca como pagada
6. Proveedor recibe pago antes de vencer

**Resultado:** 
- Relaciones comerciales sólidas
- Posibles descuentos por pago oportuno
- Confianza del proveedor

---

### Caso de Uso 4: Auditoría y Cumplimiento Normativo

**Escenario:** Un auditor externo requiere validar la gestión de costos.

**Documentación Disponible en BIDFOR:**
1. ✅ Toda factura cargada con PDF original
2. ✅ Auditoría de quién cargó y cuándo
3. ✅ Validación por persona autorizada
4. ✅ Trazabilidad completa de cambios
5. ✅ Reporte exportable con firma digital

**Ventaja:** Cumplir auditorías en minutos, no en días.

---

### Caso de Uso 5: Análisis Mensual de Rentabilidad

**Escenario:** Cada mes se genera un informe ejecutivo para la junta directiva.

**Proceso:**
1. Acceder a Dashboard
2. Screenshot de KPIs
3. Descargar gráficos (Distribución, Cartera, etc.)
4. Exportar detallado a Excel
5. Incorporar a presentación

**Antes:** Requería 2-3 horas de compilación manual
**Ahora:** 15 minutos

---

## PREGUNTAS FRECUENTES

### ¿Qué pasa si cargo una factura por error?

**Respuesta:** BIDFOR permite "eliminar" facturas sin borrarlas realmente (soft delete).

1. Ve a la factura en la tabla
2. Haz clic en el icono de basura en Acciones
3. Se marca como eliminada pero se conserva el historial
4. Si cambias de opinión, puedes restaurarla

### ¿La IA siempre extrae correctamente los datos?

**Respuesta:** La IA es muy precisa (95%+) pero no perfecta. Por eso BIDFOR usa "Inteligencia Aumentada":

- La IA extrae y prellencha
- **TÚ SIEMPRE confirmas** antes de guardar
- Si hay error, corriges en 10 segundos
- El control final está en humanos

### ¿Qué documentos de soporte tengo?

**Respuesta:** Cada factura cargada tiene:
- PDF/Imagen original guardado en la nube
- Metadata de cuándo y quién la cargó
- Historial de cambios si se edita

### ¿Puedo editar una factura ya guardada?

**Respuesta:** Sí, pero con auditoría completa:

1. Ve a la factura
2. Haz clic en el icono de lápiz (Editar)
3. Modifica los campos necesarios
4. Guarda
5. Se registra: quién, qué cambió, cuándo

### ¿Cómo funciona la Carga en Lote?

**Respuesta:** 
- Subes múltiples PDFs
- IA procesa máximo 3 en paralelo
- Cada una se extrae, valida, sube
- Al final: Reporte con exitosas y errores
- Todo en 5-10 minutos vs. 30-50 minutos manual

### ¿Qué pasa si falla la API de Claude?

**Respuesta:** BIDFOR tiene Plan B:

- Puedes cargar facturas manualmente
- Rellenas todos los campos sin IA
- Toma más tiempo pero es viable
- La continuidad del negocio se garantiza

### ¿Dónde están almacenadas mis facturas?

**Respuesta:** 
- Base de datos: Supabase (PostgreSQL en la nube)
- PDFs: Supabase Storage (servidor seguro)
- Backups: Automáticos diarios
- Cifrado: Todos los datos en tránsito y reposo

### ¿Cómo calcula el margen %?

**Respuesta:** 
```
Margen % = (Ganancia / Ingresos) × 100
```
Donde:
- Ganancia = Ingresos - Costos
- Ingresos = Suma de valores adjudicados
- Costos = Suma de valores de facturas

### ¿Qué significa "Alerta Porcentaje"?

**Respuesta:** Es el % de consumo presupuestal que activa una alerta.

- Default: 80%
- Si tu proyecto tiene presupuesto $1M y has consumido $800K = 80% → Alerta activada
- La barra se torna amarilla
- Si llegas a 100%+ la barra se torna roja

### ¿Puedo cambiar el número de un proyecto?

**Respuesta:** No. El número de proyecto es inmutable (no se puede cambiar) porque es el ID único que vincula todas las facturas.

Si necesitas cambiar, debes crear un proyecto nuevo.

---

## SOLUCIÓN DE PROBLEMAS

### Problema: "No puedo cargar PDF"

**Posibles Causas:**

1. **Archivo muy grande (>50MB)**
   - Solución: Reduce el tamaño del PDF o divídelo

2. **Formato no soportado**
   - Soportados: PDF, JPG, PNG, WebP, XML
   - Solución: Convierte el archivo al formato correcto

3. **Conexión intermitente**
   - Solución: Verifica tu conexión a internet
   - Intenta nuevamente

4. **Navegador desactualizado**
   - Solución: Actualiza tu navegador
   - Prueba en Chrome o Firefox

**Acción:** Si persiste, contacta a administrador del sistema.

---

### Problema: "Los datos extraídos están mal"

**Solución Paso a Paso:**

1. Revisa el PDF original
   - ¿Es legible?
   - ¿Están claros los números?

2. Si PDF está bien pero IA extrajo mal:
   - Edita manualmente los campos
   - Corrección toma <1 minuto
   - Guarda el cambio

3. Reporta a equipo técnico si:
   - IA consistentemente falla con cierto proveedor
   - Ciertos PDFs tienen formato inusual
   - Ello ayuda a mejorar

---

### Problema: "Dashboard no actualiza"

**Soluciones:**

1. **Recarga la página**
   - F5 o Ctrl+R
   - Espera 30 segundos

2. **Limpia caché del navegador**
   - Ctrl+Shift+Del
   - Elimina datos de sitios web

3. **Cierra y reabre sesión**
   - Logout → Login

4. **Intenta en otro navegador**
   - ¿Funciona en Chrome pero no en Firefox?
   - Problema de navegador, no de sistema

---

### Problema: "No puedo descargar el Excel"

**Soluciones:**

1. **Desactiva bloqueador de descargas**
   - Tu navegador puede estar bloqueando
   - Habilita descargas del sitio

2. **Revisa carpeta de descargas**
   - Quizás se descargó pero no viste
   - Busca "BidFor-Costos-"

3. **Intenta en incógnita**
   - Abre pestaña privada
   - Prueba de nuevo

4. **Espacio en disco**
   - ¿Tu computadora tiene espacio?
   - Libera espacio y reintenta

---

### Problema: "Una factura desapareció"

**¿Qué pasó?**

1. **Fue eliminada (soft delete)**
   - En Facturas → checkbox "Ver Eliminadas"
   - Aparecerá la factura eliminada
   - Puedes restaurarla

2. **Estoy filtrando sin saberlo**
   - Revisa los filtros de Proyecto y Estado
   - La factura puede estar filtrada
   - Limpia filtros: "Todos los proyectos" + "Todas"

3. **Fue cargada en otro proyecto**
   - Busca en proyecto diferente
   - O filtra por proveedor

---

### Problema: "Carga en Lote muestra errores"

**Revisar:**

1. **Detalles del error**
   - Sistema especifica el motivo
   - Ej: "Campos faltantes: NIT"

2. **Causas Comunes:**
   - PDF ilegible
   - Factura incompleta
   - Fecha inválida
   - Archivo corrupto

3. **Acciones:**
   - Corrige el PDF
   - Reintenta carga
   - O cargarlo manualmente

---

### Problema: "Acceso denegado"

**Soluciones:**

1. **¿Estoy logueado?**
   - Verifica URL
   - Debe mostrar tu usuario
   - Si no, haz login

2. **¿Tengo permisos?**
   - Algunos módulos requieren rol específico
   - Contacta admin para solicitar acceso

3. **Sesión expirada**
   - Cierra y abre sesión nuevamente
   - Las sesiones duran 24 horas

---

## GLOSARIO DE TÉRMINOS

| Término | Definición |
|---------|-----------|
| **Centro de Costo** | Proyecto o contrato al cual se le asignan facturas y presupuesto |
| **Factura** | Documento de cobro de proveedor con valores e impuestos |
| **IVA** | Impuesto al Valor Agregado (19% en Colombia) |
| **Retención** | Descuento obligatorio por ley (usualmente 3% en servicios) |
| **Valor Neto a Pagar** | Valor Base + IVA - Retención |
| **Vencimiento** | Fecha límite para pagar la factura |
| **Estado Pendiente** | Factura registrada pero no pagada |
| **Estado Pagada** | Factura completamente pagada |
| **Estado Parcial** | Factura parcialmente pagada |
| **Soft Delete** | Eliminar sin borrar (se puede restaurar) |
| **IA Generativa** | Inteligencia Artificial que genera/extrae información |
| **Claude API** | Servicio de IA de Anthropic para procesamiento de documentos |
| **Supabase** | Plataforma de base de datos y backend en la nube |
| **Dashboard** | Panel de control con métricas e indicadores |
| **KPI** | Key Performance Indicator (indicador de desempeño) |
| **Margen** | Ganancia como porcentaje de ingresos |
| **Rentabilidad** | Capacidad de generar ganancias |
| **Almacenamiento** | En la nube, con PDFs originales |
| **Auditoría** | Registro de quién hizo qué y cuándo |
| **Carga en Lote** | Procesar múltiples facturas simultáneamente |
| **Proveedor** | Empresa/persona que emite la factura |
| **NIT** | Número de Identificación Tributaria |

---

## CONCLUSIONES

### Transformación Lograda

BIDFOR ha revolucionado la gestión de centros de costos en BIDFOR SAS:

✅ **Eficiencia:** 90% menos tiempo en gestión de facturas
✅ **Precisión:** Validación asistida por IA + control humano
✅ **Visibilidad:** Dashboard en tiempo real con métricas clave
✅ **Rentabilidad:** Identificación inmediata de riesgos y oportunidades
✅ **Cumplimiento:** Auditoría completa y trazabilidad total

### Próximos Pasos

**Fase 2 (Corto Plazo):**
- Integración con Google Drive para auto-ingesta
- Alertas por WhatsApp/Email
- Gestión multi-usuario con roles de permisos

**Fase 3 (Mediano Plazo):**
- Integración con ERPs (Siigo, World Office)
- Análisis predictivo de rentabilidad
- Reportes automáticos para junta directiva

### Capacitación y Soporte

Para preguntas adicionales:
- **Equipo de Soporte:** [bidforhackathon@gmail.com]
- **Documentación:** Este manual (siempre disponible)
- **Video Tutoriales:** [[enlace a videos]](https://drive.google.com/drive/folders/1xQIOkNvmvmFJgToeCNUdOKKRTLPALlod)


### Reconocimiento

Este sistema fue desarrollado por el equipo de innovación de BIDFOR SAS en el Hackathon EAFIT 2026, con apoyo de la Beca SER ANDI, demostrando el poder de la tecnología para transformar procesos empresariales reales.

---

**Documento Finalizado:** 6 de Junio de 2026
**Vigencia:** Mientras no se indique actualización
**Próxima Revisión:** Diciembre de 2026
