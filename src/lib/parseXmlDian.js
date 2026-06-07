/**
 * Parsea facturas electrónicas DIAN en formato XML
 * Soporta formato UBL 2.1 de DIAN
 */

export async function parseXmlDian(file) {
  try {
    const xmlText = await file.text()
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml')

    // Verificar si hay errores en el parsing
    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('XML inválido o malformado')
    }

    // Detectar si es Invoice o AttachedDocument
    let invoiceElement = xmlDoc.getElementsByTagName('Invoice')[0]
    let isAttachedDocument = false

    if (!invoiceElement) {
      const attachedDoc = xmlDoc.getElementsByTagName('AttachedDocument')[0]
      if (attachedDoc) {
        // Si es AttachedDocument, buscar Invoice dentro de Description
        const externalRef = attachedDoc.getElementsByTagName('ExternalReference')[0]
        if (externalRef) {
          const description = externalRef.getElementsByTagName('Description')[0]
          if (description && description.textContent) {
            const innerXml = description.textContent
            const innerParser = new DOMParser()
            const innerDoc = innerParser.parseFromString(innerXml, 'application/xml')
            invoiceElement = innerDoc.getElementsByTagName('Invoice')[0]
            isAttachedDocument = true
          }
        }
      }
    }

    if (!invoiceElement) {
      throw new Error('No se encontró elemento Invoice en el XML')
    }

    // Extraer datos de la factura
    const datos = extraerDatos(invoiceElement)

    return {
      ...datos,
      esXml: true,
      esAttachedDocument: isAttachedDocument,
    }
  } catch (err) {
    console.error('Error parseando XML DIAN:', err)
    throw new Error(`Error al procesar XML: ${err.message}`)
  }
}

function extraerDatos(invoiceElement) {
  const ns = {
    cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
  }

  // Número de factura
  const numeroFactura = obtenerTexto(invoiceElement, 'cbc:ID', ns)
  if (!numeroFactura) {
    throw new Error('No se encontró número de factura (cbc:ID)')
  }

  // Fecha
  const fechaEmision = obtenerTexto(invoiceElement, 'cbc:IssueDate', ns)
  if (!fechaEmision) {
    throw new Error('No se encontró fecha de emisión')
  }

  // Proveedor (Supplier)
  const supplierParty = invoiceElement.getElementsByTagNameNS(ns.cac, 'AccountingSupplierParty')[0]
  if (!supplierParty) {
    throw new Error('No se encontró información del proveedor')
  }

  const nombreProveedor = obtenerTexto(supplierParty, 'cbc:RegistrationName', ns)
  const nitProveedor = obtenerTexto(supplierParty, 'cbc:CompanyID', ns)

  if (!nombreProveedor || !nitProveedor) {
    throw new Error('Proveedor incompleto (falta nombre o NIT)')
  }

  // Totales (Tax totals)
  const taxTotal = invoiceElement.getElementsByTagNameNS(ns.cac, 'TaxTotal')[0]
  const valorIvaTexto = obtenerTexto(taxTotal, 'cbc:TaxAmount', ns) || '0'

  // Total a pagar (Legal Monetary Total)
  const monetaryTotal = invoiceElement.getElementsByTagNameNS(ns.cac, 'LegalMonetaryTotal')[0]
  const valorNetoTexto = obtenerTexto(monetaryTotal, 'cbc:TaxInclusiveAmount', ns)
  const valorBaseTexto = obtenerTexto(monetaryTotal, 'cbc:TaxExclusiveAmount', ns)

  if (!valorNetoTexto) {
    throw new Error('No se encontró valor total a pagar')
  }

  // Limpiar y convertir valores
  const valorBase = limpiarValorNumerico(valorBaseTexto || valorNetoTexto)
  const valorIva = limpiarValorNumerico(valorIvaTexto)
  const porcentajeIva = calcularPorcentajeIva(valorBase, valorIva)
  const valorNeto = limpiarValorNumerico(valorNetoTexto)

  // Fecha de vencimiento (si existe)
  const fechaVencimiento = obtenerTexto(invoiceElement, 'cbc:DueDate', ns) || fechaEmision

  return {
    numero_factura: numeroFactura,
    nombre_proveedor: nombreProveedor,
    nit_proveedor: nitProveedor,
    fecha_emision: fechaEmision,
    fecha_vencimiento: fechaVencimiento,
    valor_antes_iva: valorBase,
    valor_iva: valorIva,
    porcentaje_iva: porcentajeIva,
    valor_neto_pagar: valorNeto,
    aplica_retencion: false,
    valor_retencion: 0,
  }
}

function obtenerTexto(elemento, etiqueta, ns) {
  if (!elemento) return null

  // Intentar con namespace
  const partes = etiqueta.split(':')
  if (partes.length === 2) {
    const nsKey = partes[0]
    const localName = partes[1]
    const nsUri = ns[nsKey]
    if (nsUri) {
      const elem = elemento.getElementsByTagNameNS(nsUri, localName)[0]
      if (elem) return elem.textContent.trim()
    }
  }

  // Intentar sin namespace
  const elem = elemento.getElementsByTagName(etiqueta)[0]
  return elem ? elem.textContent.trim() : null
}

function limpiarValorNumerico(valor) {
  if (!valor) return 0
  return parseFloat(valor.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0
}

function calcularPorcentajeIva(base, iva) {
  if (base <= 0) return 0
  const porcentaje = (iva / base) * 100
  return Math.round(porcentaje * 100) / 100
}
