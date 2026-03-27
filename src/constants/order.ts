import type { DraftForm, ItemRow } from '../types/order'

export const DEFAULT_ITEM_OPTIONS = ['Lower / Track Pant', 'T-Shirt', 'Hoodie', 'Shorts']
export const DRAFT_KEY = 'ssk_phase_switch_order_draft'
export const ITEM_OPTIONS_KEY = 'ssk_phase_switch_item_options'

export const makeItem = (size = ''): ItemRow => ({
  size,
  color: '',
  pieces: 0,
  rate: 0,
})

export const getDefaultForm = (): DraftForm => ({
  party_id: '',
  item_name: DEFAULT_ITEM_OPTIONS[0],
  is_embroidery: false,
  embroidery_placements: [],
  embroidery_others_text: '',
  is_batch: false,
  is_printing: false,
  process_rate: 0,
  transport_details: '',
  gst_percent: 5,
  items: [makeItem()],
})
