import { supabase } from '../lib/supabase'
import type { Party, QuickParty, ProviderMode, SaveOrderInput, SaveOrderResult } from '../types/order'

// Determine the provider mode from environment variable, default to 'supabase'
const rawMode = String(import.meta.env.VITE_DATA_PROVIDER ?? 'supabase').trim().toLowerCase()

// Export the normalized provider mode
export const providerMode: ProviderMode = rawMode === 'laravel' ? 'laravel' : 'supabase'

// Get and normalize the backend base URL for Laravel API calls
export const backendBaseUrl = String(import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://127.0.0.1:8000')
  .trim()
  .replace(/\/$/, '') // Remove trailing slash

// Check if the provider is configured (Supabase client exists or backend URL is set)
export const providerConfigured = providerMode === 'laravel' ? Boolean(backendBaseUrl) : Boolean(supabase)

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
        is_batch: payload.isBatch,
        is_printing: payload.isPrinting,
        process_rate: payload.processRate,
        transport_details: payload.transportDetails,
        gst_percent: payload.gstPercent,
        grand_total: payload.grandTotal,
        embroidery_details: payload.embroideryDetails ?? null,
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

  // Insert order header into Supabase
  const { data: createdOrder, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        party_id: payload.partyId,
        item_name: payload.itemName,
        is_embroidery: payload.isEmbroidery,
        is_batch: payload.isBatch,
        is_printing: payload.isPrinting,
        process_rate: payload.processRate,
        transport_details: payload.transportDetails,
        gst_percent: payload.gstPercent,
        grand_total: payload.grandTotal,
      },
    ])
    .select('id')
    .single()

  if (orderError || !createdOrder) {
    throw new Error(orderError?.message ?? 'Unable to save order.')
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
    // Rollback: delete the order if items failed
    await supabase.from('orders').delete().eq('id', createdOrder.id)
    throw new Error(itemError.message)
  }

  // Return success result (no PDF URL for Supabase mode)
  return {
    orderId: createdOrder.id,
    message: `Order #${createdOrder.id} saved successfully.`,
    pdfUrl: null,
  }
}
