import { supabase } from '../lib/supabase'
import type { Party, QuickParty, ProviderMode, SaveOrderInput, SaveOrderResult, OrderSummary, OrderDetail } from '../types/order'

// Determine the provider mode from environment variable, default to 'supabase'
const rawMode = String(import.meta.env.VITE_DATA_PROVIDER ?? 'supabase').trim().toLowerCase()
const rawBackendBaseUrl = String(import.meta.env.VITE_BACKEND_BASE_URL ?? '').trim()

// Export the normalized provider mode
export const providerMode: ProviderMode = rawMode === 'laravel' ? 'laravel' : 'supabase'

// Get and normalize the backend base URL for Laravel API calls
export const backendBaseUrl = String(rawBackendBaseUrl || 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '') // Remove trailing slash

// Check if the provider is configured (Supabase client exists or backend URL is set)
export const providerConfigured = providerMode === 'laravel' ? Boolean(rawBackendBaseUrl) : Boolean(supabase)

// Diagnostic logging
const debugLog = {
  supabaseClient: supabase ? 'initialized' : 'null',
  providerMode,
  providerConfigured,
  backendBaseUrl,
  timestamp: new Date().toISOString(),
}

if (!providerConfigured) {
  console.error('❌ Provider not configured:', debugLog)
} else {
  console.log('✅ Provider configured:', debugLog)
}

// Export diagnostics for debugging
export const providerDiagnostics = debugLog

// Build full URL for backend API endpoints
const buildBackendUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path // Already a full URL
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${backendBaseUrl}${normalizedPath}`
}

// Safely parse JSON from response, return null on failure
const readJson = async <T>(response: Response): Promise<T | null> => {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

// Make a JSON request to the backend with error handling
const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(buildBackendUrl(path), {
    ...init,
    mode: 'cors', // Enable CORS for cross-origin requests
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const payload = await readJson<Record<string, unknown>>(response)

  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload as T
}

const isMissingReferenceImageColumnError = (message: string) => {
  const normalized = String(message || '').toLowerCase()
  return normalized.includes('reference_image_name') || normalized.includes('reference_image_data')
}

// Fetch list of parties from the configured provider
export const listParties = async (): Promise<Party[]> => {
  if (providerMode === 'laravel') {
    // Call Laravel API endpoint
    return requestJson<Party[]>('/api/parties', { method: 'GET' })
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  // Query Supabase database
  const { data, error } = await supabase
    .from('parties')
    .select('id, name, city, phone, gst_no')
    .order('name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Party[]
}

// Create a new party via the configured provider
export const createParty = async (payload: QuickParty): Promise<Party> => {
  // Normalize payload data
  const normalizedPayload = {
    name: payload.name.trim(),
    city: payload.city.trim() || null,
    phone: payload.phone.trim() || null,
    gst_no: payload.gst_no.trim() || null,
  }

  if (providerMode === 'laravel') {
    // POST to Laravel API
    return requestJson<Party>('/api/parties', {
      method: 'POST',
      body: JSON.stringify(normalizedPayload),
    })
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  // Insert into Supabase
  const { data, error } = await supabase
    .from('parties')
    .insert([normalizedPayload])
    .select('id, name, city, phone, gst_no')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to add party.')
  }

  return data as Party
}

// Persist an order and its items via the configured provider
export const persistOrder = async (payload: SaveOrderInput): Promise<SaveOrderResult> => {
  if (providerMode === 'laravel') {
    // POST order data to Laravel API
    const response = await requestJson<{ message: string; order_id: number; pdf_url?: string | null }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        party_id: payload.partyId,
        item_name: payload.itemName,
        is_embroidery: payload.isEmbroidery,
        embroidery_details: payload.embroideryDetails ?? null,
        is_batch: payload.isBatch,
        is_printing: payload.isPrinting,
        process_rate: payload.processRate,
        transport_details: payload.transportDetails,
        gst_percent: payload.gstPercent,
        grand_total: payload.grandTotal,
        reference_image_name: payload.referenceImageName ?? null,
        reference_image_data: payload.referenceImageData ?? null,
        items: payload.items,
      }),
    })

    // Return result with full PDF URL
    return {
      orderId: response.order_id,
      message: response.message,
      pdfUrl: response.pdf_url ? buildBackendUrl(response.pdf_url) : null,
    }
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const coreOrderPayload = {
    party_id: payload.partyId,
    item_name: payload.itemName,
    is_embroidery: payload.isEmbroidery,
    embroidery_details: payload.embroideryDetails ?? null,
    is_batch: payload.isBatch,
    is_printing: payload.isPrinting,
    process_rate: payload.processRate,
    transport_details: payload.transportDetails,
    gst_percent: payload.gstPercent,
    grand_total: payload.grandTotal,
  }

  const orderPayloadWithImage = {
    ...coreOrderPayload,
    reference_image_name: payload.referenceImageName ?? null,
    reference_image_data: payload.referenceImageData ?? null,
  }

  let imageColumnsUnavailable = false
  let createdOrder: { id: number } | null = null

  const initialInsert = await supabase
    .from('orders')
    .insert([orderPayloadWithImage])
    .select('id')
    .single()

  if (!initialInsert.error && initialInsert.data) {
    createdOrder = initialInsert.data as { id: number }
  } else if (initialInsert.error && isMissingReferenceImageColumnError(initialInsert.error.message)) {
    imageColumnsUnavailable = true
    const fallbackInsert = await supabase
      .from('orders')
      .insert([coreOrderPayload])
      .select('id')
      .single()

    if (fallbackInsert.error || !fallbackInsert.data) {
      throw new Error(fallbackInsert.error?.message ?? 'Unable to save order.')
    }

    createdOrder = fallbackInsert.data as { id: number }
  } else {
    throw new Error(initialInsert.error?.message ?? 'Unable to save order.')
  }

  if (!createdOrder) {
    throw new Error('Unable to save order.')
  }

  // Prepare order items payload
  const orderItemsPayload = payload.items.map((item) => ({
    order_id: createdOrder.id,
    size: item.size,
    color: item.color,
    pieces: item.pieces,
    rate: item.rate,
    subtotal: item.subtotal,
  }))

  // Insert order items
  const { error: itemError } = await supabase.from('order_items').insert(orderItemsPayload)

  if (itemError) {
    // Rollback: delete the orphaned order header if items failed
    try {
      const { error: rollbackError } = await supabase.from('orders').delete().eq('id', createdOrder.id)
      if (rollbackError) {
        throw new Error(
          `Failed to save order items: ${itemError.message}. ` +
          `Additionally, rollback of order #${createdOrder.id} failed: ${rollbackError.message}. ` +
          `Please delete order #${createdOrder.id} manually in Supabase.`
        )
      }
    } catch (rollbackException) {
      if (rollbackException instanceof Error && rollbackException.message.includes('rollback')) {
        throw rollbackException // Re-throw our formatted error above
      }
      throw new Error(
        `Failed to save order items: ${itemError.message}. ` +
        `Additionally, rollback of order #${createdOrder.id} failed unexpectedly. ` +
        `Please delete order #${createdOrder.id} manually in Supabase.`
      )
    }
    throw new Error(itemError.message)
  }

  // Return success result (no PDF URL for Supabase mode)
  return {
    orderId: createdOrder.id,
    message:
      imageColumnsUnavailable && payload.referenceImageData
        ? `Order #${createdOrder.id} saved, but image was skipped because database image columns are missing.`
        : `Order #${createdOrder.id} saved successfully.`,
    pdfUrl: null,
  }
}

// Fetch list of all orders with party name, sorted newest first
export const listOrders = async (): Promise<OrderSummary[]> => {
  if (providerMode === 'laravel') {
    return requestJson<OrderSummary[]>('/api/orders', { method: 'GET' })
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const queryWithImage = await supabase
    .from('orders')
    .select('id, party_id, item_name, grand_total, created_at, reference_image_name, reference_image_data, party:parties(name, city)')
    .order('created_at', { ascending: false })

  if (!queryWithImage.error) {
    return (queryWithImage.data ?? []) as unknown as OrderSummary[]
  }

  if (!isMissingReferenceImageColumnError(queryWithImage.error.message)) {
    throw new Error(queryWithImage.error.message)
  }

  const queryFallback = await supabase
    .from('orders')
    .select('id, party_id, item_name, grand_total, created_at, party:parties(name, city)')
    .order('created_at', { ascending: false })

  if (queryFallback.error) {
    throw new Error(queryFallback.error.message)
  }

  return (queryFallback.data ?? []).map((order) => ({
    ...(order as Record<string, unknown>),
    reference_image_name: null,
    reference_image_data: null,
  })) as unknown as OrderSummary[]
}

// Fetch a single order with party info and line items
export const fetchOrder = async (orderId: number): Promise<OrderDetail> => {
  if (providerMode === 'laravel') {
    return requestJson<OrderDetail>(`/api/orders/${orderId}`, { method: 'GET' })
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const queryWithImage = await supabase
    .from('orders')
    .select('id, party_id, item_name, is_embroidery, embroidery_details, is_batch, is_printing, process_rate, transport_details, gst_percent, grand_total, created_at, reference_image_name, reference_image_data, party:parties(name, city, phone, gst_no), items:order_items(id, size, color, pieces, rate, subtotal)')
    .eq('id', orderId)
    .single()

  if (!queryWithImage.error && queryWithImage.data) {
    return queryWithImage.data as unknown as OrderDetail
  }

  if (!isMissingReferenceImageColumnError(queryWithImage.error?.message ?? '')) {
    throw new Error(queryWithImage.error?.message ?? 'Order not found.')
  }

  const queryFallback = await supabase
    .from('orders')
    .select('id, party_id, item_name, is_embroidery, embroidery_details, is_batch, is_printing, process_rate, transport_details, gst_percent, grand_total, created_at, party:parties(name, city, phone, gst_no), items:order_items(id, size, color, pieces, rate, subtotal)')
    .eq('id', orderId)
    .single()

  if (queryFallback.error || !queryFallback.data) {
    throw new Error(queryFallback.error?.message ?? 'Order not found.')
  }

  return {
    ...(queryFallback.data as Record<string, unknown>),
    reference_image_name: null,
    reference_image_data: null,
  } as unknown as OrderDetail
}

// Delete a single order (and associated items) via the configured provider
export const deleteOrder = async (orderId: number): Promise<{ message: string }> => {
  if (providerMode === 'laravel') {
    return requestJson<{ message: string }>(`/api/orders/${orderId}`, { method: 'DELETE' })
  }

  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error: itemDeleteError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId)

  if (itemDeleteError) {
    throw new Error(itemDeleteError.message)
  }

  const { error: orderDeleteError } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)

  if (orderDeleteError) {
    throw new Error(orderDeleteError.message)
  }

  return { message: `Order #${orderId} deleted successfully.` }
}
