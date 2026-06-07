/**
 * Sistema de cola para procesar facturas en lote
 * Procesa múltiples PDFs en paralelo (máximo 3 simultáneamente)
 */

import { analyzeFacturaPDF } from './analyzeFacturaPDF'
import { parseXmlDian } from './parseXmlDian'
import { uploadFacturaPDF } from './storageHelper'
import { obtenerOCrearProveedor } from './proveedorHelper'
import { supabase } from './supabase'
import { validateWithDIAN } from './dianValidator'
import { validarFechaFactura } from './dateValidator'

// Campos requeridos que DEBE extraer Claude
const CAMPOS_REQUERIDOS = [
  'numero_factura',
  'nombre_proveedor',
  'fecha_emision',
  'valor_antes_iva',
  'porcentaje_iva',
  'valor_iva',
]

function validarCamposRequeridos(datos) {
  const faltantes = CAMPOS_REQUERIDOS.filter((campo) => !datos[campo])

  return {
    valido: faltantes.length === 0,
    faltantes,
  }
}

export class FacturaQueueProcessor {
  constructor(maxParallel = 3) {
    this.queue = []
    this.processing = []
    this.completed = []
    this.errors = []
    this.maxParallel = maxParallel
    this.isRunning = false
    this.listeners = []
  }

  /**
   * Agrega archivos a la cola
   */
  addFiles(files, proyectoId, proyectoNumero, proyectoNombre) {
    files.forEach((file) => {
      this.queue.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        proyectoId,
        proyectoNumero,
        proyectoNombre,
        estado: 'pendiente',
        progreso: 0,
        error: null,
        resultado: null,
        tipo_error: null,
        timestamp: new Date().toISOString(),
      })
    })
    this.notifyListeners()
  }

  /**
   * Inicia el procesamiento de la cola
   */
  async start() {
    if (this.isRunning) return
    this.isRunning = true
    this.notifyListeners()

    while (this.queue.length > 0 || this.processing.length > 0) {
      // Agregar tareas nuevas al procesamiento
      while (this.processing.length < this.maxParallel && this.queue.length > 0) {
        const item = this.queue.shift()
        item.estado = 'procesando'
        this.processing.push(item)
        this.procesarFactura(item)
      }

      // Esperar un poco antes de verificar de nuevo
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    this.isRunning = false
    this.notifyListeners()
  }

  /**
   * Procesa una factura individual
   */
  async procesarFactura(item) {
    try {
      item.progreso = 10

      // 1. Analizar archivo (PDF/Imagen con Vision o XML con parser)
      this.notifyListeners()
      let datosExtraidos

      if (item.file.name.toLowerCase().endsWith('.xml') || item.file.type === 'text/xml' || item.file.type === 'application/xml') {
        console.log(`📄 Parseando XML: ${item.file.name}`)
        datosExtraidos = await parseXmlDian(item.file)
        console.log(`✅ XML parseado exitosamente`)
      } else {
        console.log(`📊 Analizando con Vision: ${item.file.name}`)
        datosExtraidos = await analyzeFacturaPDF(item.file)
      }

      item.progreso = 40
      this.notifyListeners()

      // 1.5. Validar que se extrajeron TODOS los campos requeridos
      const validacionCampos = validarCamposRequeridos(datosExtraidos)
      if (!validacionCampos.valido) {
        item.estado = 'error'
        item.error = `Campos faltantes: ${validacionCampos.faltantes.join(', ')}`
        item.progreso = 45
        item.tipo_error = 'campos_incompletos'
        this.errors.push(item)
        this.processing = this.processing.filter((p) => p.id !== item.id)
        this.notifyListeners()
        console.warn(`❌ [${datosExtraidos.numero_factura || 'DESCONOCIDA'}] ${item.error}`)
        return // No sube nada si faltan campos
      }

      // 1.7. Validar que sea realmente una factura (valores válidos)
      const valorBase = Number(datosExtraidos.valor_antes_iva)
      if (isNaN(valorBase) || valorBase <= 0) {
        item.estado = 'error'
        item.error = 'El documento no parece ser una factura válida (valor inválido)'
        item.progreso = 45
        item.tipo_error = 'documento_invalido'
        this.errors.push(item)
        this.processing = this.processing.filter((p) => p.id !== item.id)
        this.notifyListeners()
        console.warn(`❌ [${datosExtraidos.numero_factura || 'DESCONOCIDA'}] ${item.error}`)
        return
      }

      // Validar fecha
      const fecha = new Date(datosExtraidos.fecha_emision)
      if (isNaN(fecha.getTime())) {
        item.estado = 'error'
        item.error = 'El documento no parece ser una factura válida (fecha inválida)'
        item.progreso = 45
        item.tipo_error = 'documento_invalido'
        this.errors.push(item)
        this.processing = this.processing.filter((p) => p.id !== item.id)
        this.notifyListeners()
        console.warn(`❌ [${datosExtraidos.numero_factura || 'DESCONOCIDA'}] ${item.error}`)
        return
      }

      console.log(`✅ Todos los campos extraídos correctamente y validados`)

      // 2. Validar con DIAN (opcional)
      let validacionDIAN = null
      try {
        validacionDIAN = await validateWithDIAN(datosExtraidos)
        item.progreso = 50
      } catch (err) {
        console.warn('Validación DIAN no disponible:', err.message)
      }
      this.notifyListeners()

      // 3. Obtener o crear proveedor
      const proveedor = await obtenerOCrearProveedor(datosExtraidos)
      item.progreso = 60
      this.notifyListeners()

      // 3.5. Validar que la fecha de la factura esté dentro del rango del proyecto
      // NO lanzar error aquí, solo registrar y continuar
      const validacionFecha = await validarFechaFactura(
        datosExtraidos.fecha_emision || datosExtraidos.fecha_vencimiento,
        item.proyectoId
      )

      if (!validacionFecha.valida) {
        // Registrar como error pero CONTINUAR procesando otras facturas
        item.estado = 'error'
        item.error = validacionFecha.mensaje
        item.progreso = 65
        item.tipo_error = 'validacion_fecha'
        this.errors.push(item)
        this.processing = this.processing.filter((p) => p.id !== item.id)
        this.notifyListeners()
        console.warn(`⚠️  [${datosExtraidos.numero_factura}] ${validacionFecha.mensaje}`)
        return // Continuar con la siguiente factura sin detener el proceso
      }

      console.log(`📅 ${validacionFecha.mensaje}`)
      this.notifyListeners()

      // 4. Subir PDF a Storage
      const { archivo_url } = await uploadFacturaPDF(
        item.file,
        item.proyectoNumero,
        item.proyectoNombre,
        datosExtraidos.numero_factura
      )
      item.progreso = 80
      this.notifyListeners()

      // 5. Guardar en BD
      const datosFactura = {
        numero_factura: datosExtraidos.numero_factura,
        proveedor_id: proveedor.id,
        proyecto_id: item.proyectoId,
        fecha_emision: datosExtraidos.fecha_emision,
        fecha_vencimiento: datosExtraidos.fecha_vencimiento,
        valor_antes_iva: Number(datosExtraidos.valor_antes_iva),
        porcentaje_iva: Number(datosExtraidos.porcentaje_iva),
        valor_iva: Number(datosExtraidos.valor_iva),
        aplica_retencion: datosExtraidos.aplica_retencion,
        valor_retencion: Number(datosExtraidos.valor_retencion),
        valor_neto_pagar:
          Number(datosExtraidos.valor_antes_iva) +
          Number(datosExtraidos.valor_iva) -
          Number(datosExtraidos.valor_retencion),
        estado_pago_id: 'pendiente',
        archivo_url: archivo_url,
      }

      const { error: errorDB } = await supabase.from('facturas').insert([datosFactura])

      if (errorDB) throw errorDB

      item.estado = 'completado'
      item.progreso = 100
      item.resultado = {
        numero_factura: datosExtraidos.numero_factura,
        proveedor: proveedor.nombre,
        valor: datosExtraidos.valor_antes_iva,
        validacionDIAN: validacionDIAN?.estado || 'no-validada',
      }

      this.completed.push(item)
      this.processing = this.processing.filter((p) => p.id !== item.id)
      this.notifyListeners()
    } catch (err) {
      item.estado = 'error'
      item.error = err.message
      item.progreso = -1

      // Clasificar tipo de error
      if (!item.tipo_error) {
        if (err.message.includes('analizar')) {
          item.tipo_error = 'analisis'
        } else if (err.message.includes('proveedor')) {
          item.tipo_error = 'proveedor'
        } else if (err.message.includes('Storage')) {
          item.tipo_error = 'storage'
        } else if (err.message.includes('database') || err.message.includes('insert')) {
          item.tipo_error = 'base_datos'
        } else {
          item.tipo_error = 'desconocido'
        }
      }

      this.errors.push(item)
      this.processing = this.processing.filter((p) => p.id !== item.id)
      this.notifyListeners()
    }
  }

  /**
   * Pausa el procesamiento
   */
  pause() {
    this.isRunning = false
    this.notifyListeners()
  }

  /**
   * Reanuda el procesamiento
   */
  resume() {
    if (!this.isRunning) {
      this.start()
    }
  }

  /**
   * Obtiene estado actual
   */
  getStatus() {
    return {
      total: this.queue.length + this.processing.length + this.completed.length + this.errors.length,
      pendientes: this.queue.length,
      procesando: this.processing.length,
      completadas: this.completed.length,
      errores: this.errors.length,
      porcentaje: Math.round(
        (this.completed.length * 100) /
          (this.queue.length + this.processing.length + this.completed.length + this.errors.length || 1)
      ),
      isRunning: this.isRunning,
    }
  }

  /**
   * Obtiene detalles de tareas
   */
  getTasks() {
    return {
      completadas: this.completed,
      procesando: this.processing,
      pendientes: this.queue,
      errores: this.errors,
    }
  }

  /**
   * Suscribirse a cambios
   */
  subscribe(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  /**
   * Notifica a todos los listeners
   */
  notifyListeners() {
    const status = this.getStatus()
    this.listeners.forEach((callback) => callback(status))
  }

  /**
   * Limpia la cola
   */
  clear() {
    this.queue = []
    this.processing = []
    this.completed = []
    this.errors = []
    this.notifyListeners()
  }
}
