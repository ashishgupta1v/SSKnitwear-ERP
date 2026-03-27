import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import {
  DEFAULT_ITEM_OPTIONS,
  DRAFT_KEY,
  ITEM_OPTIONS_KEY,
  getDefaultForm,
  makeItem,
} from '../constants/order'
import { createParty, listParties, persistOrder, providerConfigured, providerMode } from '../services/orderDataProvider'
import type {
  DraftForm,
  EmbroideryPlacement,
  ItemRow,
  Party,
  QuickParty,
  SaveOrderInput,
} from '../types/order'

// Utility function to normalize numbers with fallback
const normalizeNumber = (value: unknown, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

// Utility function to normalize item rows from partial data
const normalizeItemRow = (row: Partial<ItemRow> | null | undefined): ItemRow => ({
  size: normalizeNumber(row?.size, 0),
  color: String(row?.color ?? '').trim(),
  pieces: normalizeNumber(row?.pieces, 0),
  rate: normalizeNumber(row?.rate, 0),
})

// Utility function to normalize and deduplicate item options
const normalizeItemOptions = (options: unknown): string[] => {
  if (!Array.isArray(options)) {
    return [...DEFAULT_ITEM_OPTIONS]
  }

  const seen = new Set<string>()
  const normalized = options
    .map((value) => String(value ?? '').trim())
    .filter((value) => {
      if (!value) return false
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  return normalized.length ? normalized : [...DEFAULT_ITEM_OPTIONS]
}

// Main composable for order entry state management
export const useOrderEntry = () => {
  // Reactive state for the order form
  const form = ref<DraftForm>(getDefaultForm())
  // List of available parties
  const parties = ref<Party[]>([])
  // Options for item names, including custom ones
  const itemOptions = ref<string[]>([...DEFAULT_ITEM_OPTIONS])
  // UI state for showing party creation modal
  const showPartyCreate = ref(false)
  // UI state for showing item creation modal
  const showItemCreate = ref(false)
  // Loading state for party creation
  const creatingParty = ref(false)
  // Loading state for order saving
  const savingOrder = ref(false)
  // Feedback message for user actions
  const feedback = ref('')
  // ID of the last saved order
  const lastSavedOrderId = ref<number | null>(null)
  // URL for the last generated PDF
  const lastSavedPdfUrl = ref<string | null>(null)
  // Flag to prevent premature draft saves during hydration
  const hasHydratedDraft = ref(false)
  // Timer used to debounce local draft persistence.
  let draftSaveTimer: ReturnType<typeof setTimeout> | null = null
  // Input for custom item name
  const customItemName = ref('')
  // Form data for quick party creation
  const quickParty = ref<QuickParty>({
    name: '',
    city: '',
    phone: '',
    gst_no: '',
  })

  // Computed label for the current provider mode
  const modeLabel = computed(() => {
    return providerMode === 'laravel' ? 'Phase 2 · Laravel API bridge' : 'Phase 1 · Supabase direct'
  })

  // Computed warning message if provider is not configured
  const providerWarning = computed(() => {
    if (providerConfigured) {
      return ''
    }

    return providerMode === 'laravel'
      ? 'Laravel API mode is enabled but the backend URL is missing.'
      : 'Supabase is not configured. Create .env from .env.example.'
  })

  // Computed boolean to enable save button
  const canSave = computed(() => providerConfigured)

  // Computed selected party object
  const selectedParty = computed(() => {
    return parties.value.find((party) => String(party.id) === form.value.party_id) ?? null
  })

  // Computed current date for invoice
  const invoiceDate = computed(() => {
    return new Date().toLocaleDateString('en-GB')
  })

  // Computed summary of embroidery details
  const embroiderySummary = computed(() => {
    if (!form.value.is_embroidery) return 'No'

    const placements = [...form.value.embroidery_placements]
    const hasOthers = placements.includes('Others')
    const cleanOthers = form.value.embroidery_others_text.trim()
    const normalized: string[] = placements.filter((placement) => placement !== 'Others')

    if (hasOthers) {
      normalized.push(cleanOthers ? `Others: ${cleanOthers}` : 'Others')
    }

    return normalized.length ? normalized.join(', ') : 'Yes'
  })

  // Computed boolean if any process is active
  const isProcessActive = computed(() => {
    return form.value.is_embroidery || form.value.is_batch || form.value.is_printing
  })

  // Computed rows with subtotals
  const rows = computed(() => {
    return form.value.items.map((item) => ({
      ...item,
      subtotal: Number(item.pieces || 0) * Number(item.rate || 0),
    }))
  })

  // Computed subtotal from all rows
  const subtotal = computed(() => rows.value.reduce((sum, row) => sum + row.subtotal, 0))
  // Computed total pieces across all rows
  const totalPieces = computed(() => rows.value.reduce((sum, row) => sum + Number(row.pieces || 0), 0))
  // Computed process surcharge if active
  const processSurcharge = computed(() => {
    return isProcessActive.value ? totalPieces.value * Number(form.value.process_rate || 0) : 0
  })
  // Computed GST amount
  const gstAmount = computed(() => {
    return (subtotal.value + processSurcharge.value) * (Number(form.value.gst_percent || 0) / 100)
  })
  // Computed grand total
  const grandTotal = computed(() => subtotal.value + processSurcharge.value + gstAmount.value)

  // Save current form and item options to localStorage
  const saveDraftLocally = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form.value))
      localStorage.setItem(ITEM_OPTIONS_KEY, JSON.stringify(itemOptions.value))
    } catch {
      // Ignore localStorage write failures.
    }
  }

  // Restore form and item options from localStorage
  const hydrateDraft = () => {
    try {
      const savedItemOptions = localStorage.getItem(ITEM_OPTIONS_KEY)
      if (savedItemOptions) {
        itemOptions.value = normalizeItemOptions(JSON.parse(savedItemOptions))
      }

      const savedDraft = localStorage.getItem(DRAFT_KEY)
      if (!savedDraft) return

      const parsed = JSON.parse(savedDraft) as Partial<DraftForm>
      const defaults = getDefaultForm()

      form.value = {
        ...defaults,
        ...parsed,
        party_id: String(parsed.party_id ?? ''),
        item_name: String(parsed.item_name ?? defaults.item_name).trim() || defaults.item_name,
        is_embroidery: Boolean(parsed.is_embroidery),
        embroidery_placements: Array.isArray(parsed.embroidery_placements)
          ? parsed.embroidery_placements.filter(
            (value): value is EmbroideryPlacement => value === 'Front' || value === 'Back' || value === 'Others',
          )
          : [],
        embroidery_others_text: String(parsed.embroidery_others_text ?? ''),
        is_batch: Boolean(parsed.is_batch),
        is_printing: Boolean(parsed.is_printing),
        process_rate: normalizeNumber(parsed.process_rate, 0),
        transport_details: String(parsed.transport_details ?? ''),
        gst_percent: normalizeNumber(parsed.gst_percent, defaults.gst_percent),
        items:
          Array.isArray(parsed.items) && parsed.items.length
            ? parsed.items.map((row) => normalizeItemRow(row))
            : defaults.items,
      }

      if (!itemOptions.value.some((option) => option.toLowerCase() === form.value.item_name.toLowerCase())) {
        itemOptions.value = [...itemOptions.value, form.value.item_name].sort((a, b) => a.localeCompare(b))
      }
    } catch {
      // Ignore malformed localStorage payloads.
    }
  }

  // Add a new size row to the form
  const addSizeRow = () => {
    form.value.items.push(makeItem())
  }

  // Remove a size row by index, minimum 1 row
  const removeSizeRow = (index: number) => {
    if (form.value.items.length <= 1) return
    form.value.items.splice(index, 1)
  }

  // Add a custom item option to the list
  const addCustomItemOption = () => {
    const name = customItemName.value.trim()

    if (!name) {
      feedback.value = 'Item name is required to add a custom option.'
      return
    }

    const existing = itemOptions.value.find((option) => option.toLowerCase() === name.toLowerCase())

    if (existing) {
      form.value.item_name = existing
      customItemName.value = ''
      showItemCreate.value = false
      feedback.value = 'Existing item option selected.'
      return
    }

    itemOptions.value = [...itemOptions.value, name].sort((a, b) => a.localeCompare(b))
    form.value.item_name = name
    customItemName.value = ''
    showItemCreate.value = false
    feedback.value = 'Custom item option added.'
  }

  // Load parties from the data provider
  const loadParties = async () => {
    if (!providerConfigured) {
      feedback.value = providerWarning.value
      return
    }

    try {
      parties.value = await listParties()
    } catch (error) {
      feedback.value = error instanceof Error ? error.message : 'Unable to load parties.'
    }
  }

  // Create a new party via the data provider
  const addParty = async () => {
    feedback.value = ''

    if (!providerConfigured) {
      feedback.value = providerWarning.value
      return
    }

    if (!quickParty.value.name.trim()) {
      feedback.value = 'Party name is required.'
      return
    }

    creatingParty.value = true

    try {
      const party = await createParty(quickParty.value)
      parties.value = [...parties.value, party].sort((a, b) => a.name.localeCompare(b.name))
      form.value.party_id = String(party.id)
      showPartyCreate.value = false
      quickParty.value = { name: '', city: '', phone: '', gst_no: '' }
      feedback.value = 'Party added successfully.'
    } catch (error) {
      feedback.value = error instanceof Error ? error.message : 'Unable to add party.'
    } finally {
      creatingParty.value = false
    }
  }

  // Save the order via the data provider
  const saveOrder = async () => {
    if (savingOrder.value) {
      return
    }

    feedback.value = ''

    if (!providerConfigured) {
      feedback.value = providerWarning.value
      return
    }

    if (!form.value.party_id) {
      feedback.value = 'Please select a party.'
      return
    }

    if (!parties.value.some((party) => String(party.id) === form.value.party_id)) {
      feedback.value = 'Selected party is no longer available. Please select again.'
      return
    }

    if (!form.value.item_name.trim()) {
      feedback.value = 'Please select an item name.'
      return
    }

    const orderItems = rows.value
      .filter((row) => Number(row.pieces || 0) > 0)
      .map((row) => ({
        size: Number(row.size || 0),
        color: row.color?.trim() || null,
        pieces: Number(row.pieces || 0),
        rate: Number(row.rate || 0),
        subtotal: Number(row.subtotal.toFixed(2)),
      }))

    if (!orderItems.length) {
      feedback.value = 'Add at least one row with pieces greater than 0.'
      return
    }

    savingOrder.value = true

    const payload: SaveOrderInput = {
      partyId: Number(form.value.party_id),
      itemName: form.value.item_name.trim(),
      isEmbroidery: form.value.is_embroidery,
      isBatch: form.value.is_batch,
      isPrinting: form.value.is_printing,
      processRate: isProcessActive.value ? Number(form.value.process_rate || 0) : 0,
      transportDetails: form.value.transport_details.trim() || null,
      gstPercent: Number(form.value.gst_percent || 0),
      grandTotal: Number(grandTotal.value.toFixed(2)),
      embroideryDetails: embroiderySummary.value === 'No' ? null : embroiderySummary.value,
      items: orderItems,
    }

    try {
      const result = await persistOrder(payload)
      lastSavedOrderId.value = result.orderId
      lastSavedPdfUrl.value = result.pdfUrl
      feedback.value = result.message
    } catch (error) {
      feedback.value = error instanceof Error ? error.message : 'Unable to save order.'
    } finally {
      savingOrder.value = false
    }
  }

  // Print the bill, either open PDF or trigger browser print
  const printBill = () => {
    if (providerMode === 'laravel') {
      if (!lastSavedPdfUrl.value) {
        feedback.value = 'Save the order first to generate the Laravel PDF.'
        return
      }

      window.open(lastSavedPdfUrl.value, '_blank', 'noopener,noreferrer')
      return
    }

    window.print()
  }

  // Watch for embroidery toggle to reset placements
  watch(
    () => form.value.is_embroidery,
    (isEmbroidery) => {
      if (!isEmbroidery) {
        form.value.embroidery_placements = []
        form.value.embroidery_others_text = ''
      }
    },
  )

  // Watch for 'Others' in placements to reset text
  watch(
    () => form.value.embroidery_placements.includes('Others'),
    (hasOthers) => {
      if (!hasOthers) {
        form.value.embroidery_others_text = ''
      }
    },
  )

  // Watch for form/itemOptions changes to auto-save draft
  watch(
    [form, itemOptions],
    () => {
      if (!hasHydratedDraft.value) return

      if (draftSaveTimer) {
        clearTimeout(draftSaveTimer)
      }

      draftSaveTimer = setTimeout(() => {
        saveDraftLocally()
      }, 400)
    },
    { deep: true },
  )

  onUnmounted(() => {
    if (!draftSaveTimer) {
      return
    }

    clearTimeout(draftSaveTimer)
    draftSaveTimer = null
  })

  // On mount, hydrate draft and load parties
  onMounted(async () => {
    hydrateDraft()
    hasHydratedDraft.value = true
    await loadParties()
  })

  // Return all reactive state and methods for use in components
  return {
    form,
    parties,
    itemOptions,
    showPartyCreate,
    showItemCreate,
    creatingParty,
    savingOrder,
    feedback,
    lastSavedOrderId,
    customItemName,
    quickParty,
    modeLabel,
    providerWarning,
    canSave,
    selectedParty,
    invoiceDate,
    embroiderySummary,
    rows,
    totalPieces,
    subtotal,
    processSurcharge,
    gstAmount,
    grandTotal,
    isProcessActive,
    addSizeRow,
    removeSizeRow,
    addCustomItemOption,
    addParty,
    saveOrder,
    printBill,
  }
}
