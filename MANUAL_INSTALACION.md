# MANUAL DE INSTALACIÓN - BIDFOR CENTRO DE COSTOS

---

# BIDFOR SAS
## Sistema Inteligente de Control Financiero por Proyecto

### Manual de Instalación - Versión 1.0

**Guía para Instalar y Configurar el Sistema Desde Cero**

**Fecha:** 6 de Junio de 2026

---

## TABLA DE CONTENIDO

1. [Requisitos Mínimos](#requisitos-mínimos)
2. [Requisitos de Software](#requisitos-de-software)
3. [Sistemas Operativos Compatibles](#sistemas-operativos-compatibles)
4. [Instalación de Dependencias](#instalación-de-dependencias)
5. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
6. [Configuración de Base de Datos](#configuración-de-base-de-datos)
7. [Configuración de Servicios Externos](#configuración-de-servicios-externos)
8. [Ejecución en Ambiente Local](#ejecución-en-ambiente-local)
9. [Ejecución en Ambiente Productivo](#ejecución-en-ambiente-productivo)
10. [Procedimientos de Mantenimiento](#procedimientos-de-mantenimiento)
11. [Solución de Errores Frecuentes](#solución-de-errores-frecuentes)
12. [Checklist Final](#checklist-final)

---

## REQUISITOS MÍNIMOS

### Hardware Recomendado

#### Para Desarrollo Local

| Componente | Mínimo | Recomendado |
|-----------|--------|------------|
| **Procesador** | 2 núcleos @ 1.8GHz | 4 núcleos @ 2.5GHz+ |
| **RAM** | 4 GB | 8 GB |
| **Almacenamiento** | 500 MB | 2 GB (SSD) |
| **Conexión** | 2 Mbps | 10 Mbps+ |

#### Para Servidor de Producción

| Componente | Mínimo | Recomendado |
|-----------|--------|------------|
| **Procesador** | 2 núcleos | 4 núcleos |
| **RAM** | 2 GB | 4 GB+ |
| **Almacenamiento** | 10 GB | 50 GB (SSD) |
| **Conexión** | 10 Mbps | 100 Mbps+ |

### Requisitos de Red

- ✅ Puerto 5177 disponible (Vite dev server)
- ✅ Puerto 3001 disponible (Proxy server)
- ✅ Puerto 5432 disponible (PostgreSQL, solo si es local)
- ✅ Acceso HTTPS a api.anthropic.com
- ✅ Acceso HTTPS a [tu-proyecto].supabase.co

---

## REQUISITOS DE SOFTWARE

### Requisitos Obligatorios

| Software | Versión Mínima | Versión Recomendada |
|----------|-----------------|-------------------|
| **Node.js** | 18.0.0 | 20.0.0+ |
| **npm** | 9.0.0 | 10.0.0+ |
| **Git** | 2.30 | 2.40+ |
| **Navegador Web** | Chrome 90 | Chrome/Firefox/Safari actual |

### Verificar Versiones Instaladas

```bash
# Verificar Node.js
node --version
# Debe mostrar: v18.0.0 o superior

# Verificar npm
npm --version
# Debe mostrar: 9.0.0 o superior

# Verificar Git
git --version
# Debe mostrar: git version 2.30 o superior
```

### Software Recomendado

- **Visual Studio Code** - Para edición de código
- **Postman/Insomnia** - Para testing de APIs
- **DBeaver** - Para gestión de base de datos
- **Docker** - Para ambiente aislado (opcional)

---

## SISTEMAS OPERATIVOS COMPATIBLES

### ✅ Soportados

| SO | Versión | Estado |
|---|---------|--------|
| **Windows** | 10, 11 | Completamente soportado |
| **macOS** | 11+, 12+, 13+ (Intel/Apple Silicon) | Completamente soportado |
| **Linux** | Ubuntu 20.04+, Debian 11+, CentOS 7+ | Completamente soportado |

### Instalación por SO

#### Windows 10/11

1. Descargar instaladores:
   - Node.js desde https://nodejs.org/ (LTS)
   - Git desde https://git-scm.com/

2. Ejecutar instaladores
   - Click siguiente en todas las opciones
   - Seleccionar "Add to PATH"

3. Reiniciar computadora

4. Abrir PowerShell o CMD y verificar:
```bash
node --version
npm --version
git --version
```

#### macOS (Intel/Apple Silicon)

1. Instalar Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Instalar Node.js y Git:
```bash
brew install node git
```

3. Verificar:
```bash
node --version
npm --version
git --version
```

#### Linux (Ubuntu/Debian)

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Instalar Node.js (versión 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Git
sudo apt install -y git

# Verificar
node --version
npm --version
git --version
```

---

## INSTALACIÓN DE DEPENDENCIAS

### Paso 1: Clonar Repositorio

```bash
# Opción A: Clonar desde GitHub (si está disponible)
git clone https://github.com/edwingiraldosoto/bidfor-costos-IA.git
cd bidfor-costos

# Opción B: Si no está en GitHub, descargar ZIP y extraer
# Luego abrir terminal en la carpeta descomprimida
```

### Paso 2: Instalar Dependencias de npm

```bash
# Instalar todas las dependencias del proyecto
npm install

# Esto descargará:
# - React 19.2.6
# - Vite 8.0.12
# - Tailwind CSS 3.4.19
# - Recharts 3.8.1
# - Supabase SDK
# - Y más...

# Tiempo esperado: 2-5 minutos (depende de conexión)
```

**¿Qué hace este comando?**
- Lee `package.json`
- Descarga todas las versiones exactas de `package-lock.json`
- Instala en carpeta `node_modules/`

### Paso 3: Verificar Instalación

```bash
# Verificar que las dependencias se instalaron correctamente
npm list --depth=0

# Debe mostrar:
# ├── @supabase/supabase-js@2.107.0
# ├── lucide-react@1.17.0
# ├── react@19.2.6
# ├── react-dom@19.2.6
# ├── recharts@3.8.1
# ├── tailwindcss@3.4.19
# └── vite@8.0.12
```

### Paso 4: Instalar Dependencias Globales Opcionales

```bash
# Para mejor desarrollo (opcional)
npm install -g concurrently
# Permite ejecutar múltiples comandos en paralelo
```

---

## CONFIGURACIÓN DE VARIABLES DE ENTORNO

### Paso 1: Crear Archivo `.env.local`

En la raíz del proyecto, crear archivo llamado `.env.local`:

```bash
# En Windows (PowerShell)
New-Item -Path ".env.local" -ItemType File

# En macOS/Linux (Terminal)
touch .env.local
```

### Paso 2: Obtener Credenciales de Supabase

1. Acceder a https://app.supabase.com
2. Crear cuenta (si no tienes)
3. Crear nuevo proyecto
4. En "Settings" → "API" copiar:
   - `Project URL` → será `VITE_SUPABASE_URL`
   - `anon public` key → será `VITE_SUPABASE_ANON_KEY`

### Paso 3: Obtener Credenciales de Claude API

1. Acceder a https://console.anthropic.com
2. Crear cuenta (si no tienes)
3. Ir a "API Keys"
4. Crear nueva API key
5. Copiar la clave → será para `ANTHROPIC_API_KEY`

### Paso 4: Llenar `.env.local`

Abrir el archivo y pegar la plantilla. **Luego reemplazar con TUS credenciales reales:**

```env
# Supabase Configuration
# Obtén estos valores desde https://app.supabase.com/project/[id]/settings/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_actual_key_here

# Claude API (para proxy server)
# Obtén desde https://console.anthropic.com/api_keys
VITE_API_KEY_IA=sk-ant-your-actual-api-key-here

# Backend proxy server port
PORT=3001

# Motores de IA (separados por comas)
VITE_MOTOR_IA=claude-sonnet-4-6,claude-opus-4-1

# Temperatura para IA (0-2, 0.1 recomendado para facturas)
VITE_TEMPERATURA_IA=0.1

# Proveedor de IA
VITE_PROVEEDOR_ID=anthropic
```

**⚠️ IMPORTANTE - SEGURIDAD:**
- **NUNCA commitear `.env.local` a Git** (ya está en `.gitignore`)
- **No compartir credenciales** por email, Slack, o repositorios públicos
- Cada desarrollador debe tener sus propias credenciales
- Si sospechas que una clave fue comprometida, regenerarla inmediatamente
- Usar diferentes claves para desarrollo vs producción

### Paso 5: Verificar Configuración

```bash
# Verificar que el archivo existe
ls -la .env.local

# Verificar que tiene contenido
cat .env.local
```

---

## CONFIGURACIÓN DE BASE DE DATOS

### Opción A: Usar Supabase (Recomendado - Ya Configurado)

**Ventaja:** No requiere instalación local, todo en la nube

**Pasos:**

1. En https://app.supabase.com
2. Ir a "SQL Editor"
3. Copiar el contenido de `/database/schema_simplificado.sql`
4. Pegar en el editor
5. Hacer clic "Run"
6. Repetir con los otros scripts:
   - `add_soft_delete_audit.sql`
   - `add_proyectos_auditoria.sql`

**Verificar:**
```bash
# En Supabase SQL Editor, ejecutar:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

# Debe mostrar: proyectos, facturas, proveedores, etc.
```

### Opción B: Usar PostgreSQL Local (Avanzado)

**Requisito:** PostgreSQL 14+ instalado

1. **Crear base de datos:**
```bash
# En terminal PostgreSQL
createdb bidfor_costos
```

2. **Cargar schema:**
```bash
# Desde terminal bash/pwsh
psql -U postgres -d bidfor_costos -f database/schema_simplificado.sql
```

3. **Configurar conexión en Supabase:**
- Usar "Database Link" para conectar local a Supabase
- O cambiar VITE_SUPABASE_URL a local

---

## CONFIGURACIÓN DE SERVICIOS EXTERNOS

### Claude API Configuration

**Archivo:** `server/proxy.mjs`

El proxy server maneja todas las comunicaciones con la API de IA de forma segura:

**Características de Seguridad:**
- API Key nunca se expone al navegador (se envía desde servidor)
- Rate limiting: 60 requests/minuto por IP
- Validación de requests para prevenir abusos
- Timeout: 60 segundos para requests grandes

**Configuración:** Solo necesita las variables en `.env.local`:
```env
VITE_API_KEY_IA=tu-clave-aqui
VITE_PROVEEDOR_ID=anthropic
VITE_MOTOR_IA=claude-sonnet-4-6,claude-opus-4-1
```

El proxy escucha automáticamente en `http://localhost:3001` cuando ejecutas `npm run dev`.

---

## EJECUCIÓN EN AMBIENTE LOCAL

### Opción A: Ejecución Simple (Recomendado)

```bash
# En la raíz del proyecto, ejecutar:
npm run dev

# Esto ejecuta AMBOS servidores automáticamente:
# - Frontend: http://localhost:5177
# - Proxy: http://localhost:3001
```

**¿Qué ver?**
```
[0] VITE v8.0.12  ready in 450 ms
[0] 
[0] ➜  Local:   http://localhost:5177/
[0] ➜  press h to show help

[1] ✅ Proxy server en http://localhost:3001
```

### Opción B: Ejecución Manual (Para Debugging)

**Terminal 1 - Frontend:**
```bash
npm run dev:vite
# O simplemente: vite
```

**Terminal 2 - Proxy:**
```bash
npm run proxy
# O simplemente: node server/proxy.mjs
```

### Verificar que Funciona

1. **Abrir navegador:** http://localhost:5177
   - Debe mostrar Dashboard

2. **Verificar Proxy:** Desde otro terminal:
```bash
curl -X OPTIONS http://localhost:3001/api/analyze
# Debe retornar 200 OK
```

3. **Probar Carga de Factura:**
   - Ir a Facturas
   - Hacer clic "Nueva Factura"
   - Cargar un PDF
   - Debería extraerse automáticamente

---

## EJECUCIÓN EN AMBIENTE PRODUCTIVO

### Opción A: Vercel (Recomendado para Frontend)

**Pasos:**

1. **Crear cuenta en Vercel:**
   - https://vercel.com/signup

2. **Conectar repositorio:**
   - Importar desde GitHub
   - Authorizar acceso

3. **Configurar variables de entorno:**
   - En Vercel Dashboard → Settings → Environment Variables
   - Agregar:
     ```
     VITE_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY
     ```

4. **Deploy automático:**
   - Al hacer push a main, Vercel construye y despliega automáticamente
   - URL: https://bidfor-costos.vercel.app

### Opción B: Docker (Para Desplegable Completo)

**Crear Dockerfile:**

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copiar archivos
COPY package*.json ./
COPY database ./database
COPY src ./src
COPY public ./public
COPY vite.config.js tailwind.config.js postcss.config.js ./
COPY .env.local ./

# Instalar dependencias
RUN npm install

# Build
RUN npm run build

# Ejecutar proxy en background y frontend
EXPOSE 5177 3001
CMD ["npm", "run", "dev"]
```

**Buildear y ejecutar:**

```bash
# Build
docker build -t bidfor-costos .

# Ejecutar
docker run -p 5177:5177 -p 3001:3001 bidfor-costos
```

---

## PROCEDIMIENTOS DE MANTENIMIENTO

### Backup de Base de Datos

**Automático (Supabase):**
- Supabase realiza backups diarios automáticamente
- Accesible en: https://app.supabase.com/project/[id]/backups

**Manual:**
```bash
# Exportar datos
pg_dump -U postgres bidfor_costos > backup.sql

# Importar datos
psql -U postgres bidfor_costos < backup.sql
```

### Procedimiento de Recuperación

**Si Supabase se cae:**

1. Cambiar `.env.local` a backup local
2. Importar datos de backup: `psql -f backup.sql`
3. Reiniciar servidor
4. Funciona en modo degradado

---

## SOLUCIÓN DE ERRORES FRECUENTES

### Error: "Module not found"

```
Error: Cannot find module 'react'
```

**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

### Error: "Port already in use"

```
Error: listen EADDRINUSE :::5177
```

**Solución:**

**Windows:**
```bash
# Encontrar proceso en puerto 5177
netstat -ano | findstr :5177

# Matar proceso
taskkill /PID [PID] /F
```

**macOS/Linux:**
```bash
# Encontrar proceso
lsof -i :5177

# Matar proceso
kill -9 [PID]
```

---

### Error: "Environment variables not found"

```
Error: Cannot read properties of undefined (reading 'VITE_SUPABASE_URL')
```

**Solución:**

1. Verificar que `.env.local` existe:
```bash
ls -la .env.local
```

2. Verificar que tiene contenido:
```bash
cat .env.local
```

3. Reiniciar servidor (cierra y ejecuta `npm run dev` de nuevo)

---

### Error: "Supabase connection refused"

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Significa:** No puedes conectar a PostgreSQL local

**Solución:**

1. Si usas Supabase cloud (recomendado):
   - Ya está configurado, no necesitas local

2. Si necesitas PostgreSQL local:
   ```bash
   # Instalar PostgreSQL
   # Windows: https://www.postgresql.org/download/windows/
   # macOS: brew install postgresql
   # Linux: sudo apt install postgresql
   
   # Iniciar servicio
   # Windows: Services → Start PostgreSQL
   # macOS: brew services start postgresql
   # Linux: sudo systemctl start postgresql
   ```

---

### Error: "Claude API key is invalid"

```
Error: Invalid API Key
```

**Solución:**

1. Verificar que API Key es correcta:
   - Copiar de nuevo desde console.anthropic.com

2. Verificar en `.env.local`:
   ```bash
   cat .env.local | grep ANTHROPIC_API_KEY
   ```

3. Reiniciar proxy:
   ```bash
   # Detener (Ctrl+C) y ejecutar de nuevo
   npm run proxy
   ```

---

### Error: "Cannot upload file to storage"

```
Error: 413 Payload Too Large
```

**Significa:** Archivo PDF es muy grande

**Solución:**
- Máximo 50MB por archivo
- Comprimir PDF antes de cargar
- O dividir en múltiples archivos

---

## CHECKLIST FINAL

Antes de considerar la instalación completa:

### ✅ Desarrollo Local

- [ ] Node.js 18+ instalado (`node --version`)
- [ ] npm 9+ instalado (`npm --version`)
- [ ] Git instalado (`git --version`)
- [ ] Repositorio clonado: `git clone ...`
- [ ] Dependencias instaladas: `npm install` sin errores
- [ ] `.env.local` creado con credenciales Supabase
- [ ] `.env.local` tiene `ANTHROPIC_API_KEY`
- [ ] Base de datos schema cargado (SQL scripts en Supabase)
- [ ] `npm run dev` ejecuta sin errores
- [ ] http://localhost:5177 abre sin errores
- [ ] http://localhost:3001 responde a peticiones
- [ ] Puedo cargar una factura PDF sin errores
- [ ] Dashboard muestra datos

### ✅ Producción

- [ ] Cuenta Vercel creada
- [ ] Repositorio conectado a Vercel
- [ ] Variables de entorno configuradas en Vercel
- [ ] Build de producción exitoso: `npm run build`
- [ ] Sin errores en deployment logs
- [ ] App accesible en https://[proyecto].vercel.app
- [ ] Facturas se cargan correctamente en producción
- [ ] Dashboard funciona correctamente

### ✅ Seguridad

- [ ] `.env.local` NO está en git (incluido en `.gitignore`)
- [ ] API Keys NO están en commits
- [ ] Usar HTTPS en todas las conexiones
- [ ] Backup de BD configurado

---

**Documento Finalizado:** 6 de Junio de 2026
**Vigencia:** Mientras no se indique actualización
