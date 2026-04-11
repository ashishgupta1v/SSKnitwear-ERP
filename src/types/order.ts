export type Party = {
  id: number
  name: string
  city: string | null
  phone: string | null
  gst_no: string | null
}

export type QuickParty = {
  name: string
  city: string
  phone: string
  gst_no: string
}

export type EmbroideryPlacement = 'Front' | 'Back' | 'Others'

export type ItemRow = {

  size: number | string
  color: string
  pieces: number
  rate: number
}

export type DraftForm = {
  party_id: string
  item_name: string
  is_embroidery: boolean
  embroidery_placements: EmbroideryPlacement[]
  embroidery_others_text: string
  is_batch: boolean
  is_printing: boolean
  process_rate: number
  transport_details: string
  gst_percent: number
  reference_image_name: string
  reference_image_data: string | null
  items: ItemRow[]
}

export type OrderLineInput = {
  size: number | string
  color: string | null
  pieces: number
  rate: number
  subtotal: number
}

export type SaveOrderInput = {
  partyId: number
  itemName: string
  isEmbroidery: boolean
  isBatch: boolean
  isPrinting: boolean
  processRate: number
  transportDetails: string | null
  gstPercent: number
  grandTotal: number
  embroideryDetails?: string | null
  referenceImageName?: string | null
  referenceImageData?: string | null
  items: OrderLineInput[]
}

export type SaveOrderResult = {
  orderId: number
  message: string
}

export type OrderSummary = {
  id: number
  party_id: number
  item_name: string
  grand_total: number
  created_at: string
  reference_image_name?: string | null
  reference_image_data?: string | null
  party?: { name: string; city: string | null } | null
}

export type OrderDetail = {
  id: number
  party_id: number
  item_name: string
  is_embroidery: boolean
  embroidery_details: string | null
  is_batch: boolean
  is_printing: boolean
  process_rate: number
  transport_details: string | null
  gst_percent: number
  grand_total: number
  created_at: string
  reference_image_name?: string | null
  reference_image_data?: string | null
  party?: { name: string; city: string | null; phone: string | null; gst_no: string | null } | null
  items?: OrderDetailItem[]
}

export type OrderDetailItem = {
  id: number
  size: number | string
  color: string | null
  pieces: number
  rate: number
  subtotal: number
}
