<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Party;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Browsershot\Browsershot;

/**
 * OrderController
 *
 * Central controller for the SSKnitwear ERP order workflow.
 *
 * Responsibilities:
 *  - index()       — Render the Inertia order form with all parties and sizes.
 *  - storeParty()  — Quick-add a new party via the inline form.
 *  - store()       — Validate and persist an order + line items in a transaction.
 *  - generatePdf() — Render the Blade invoice and stream it as PDF via Browsershot.
 *
 * PDF generation requires Chrome/Chromium on the host.
 * Ubuntu server: apt install chromium-browser
 */
class OrderController extends Controller
{
    /**
     * Display the order creation form.
     *
     * Passes all parties (for the party selector) and the standard knitwear
     * size sequence 32–44 as Inertia props.  The Vue page can append custom rows.
     */
    public function index(): Response
    {
        return Inertia::render('Orders/Index', [
            'parties' => Party::query()
                ->select(['id', 'name', 'city', 'phone', 'gst_no'])
                ->orderBy('name')
                ->get(),

            // Default sizes pre-populate the size grid; user can add more rows.
            'sizes' => ['32', '34', '36', '38', '40', '42', '44'],
        ]);
    }

    /**
     * Store a new party (quick-add from the order form).
     *
     * Returns the newly created party as JSON so the Vue form can immediately
     * add it to the local party list and auto-select it.
     */
    public function storeParty(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:255'],
            'city'   => ['nullable', 'string', 'max:255'],
            'phone'  => ['nullable', 'string', 'max:20'],
            'gst_no' => ['nullable', 'string', 'max:50'],
        ]);

        $party = Party::create($validated);

        return response()->json($party, 201);
    }

    /**
     * Store a new order together with its line items.
     *
     * The order header and all line items are saved inside a single DB transaction
     * so that a partial failure never leaves orphaned rows.
     *
     * Only items with pieces > 0 are persisted; empty size-grid rows are filtered
     * out to keep the invoice clean.
     *
     * Returns the PDF URL so the frontend can offer an immediate print button.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'party_id'          => ['required', 'exists:parties,id'],
            'item_name'         => ['required', 'string', 'max:255'],
            'is_embroidery'     => ['required', 'boolean'],
            'is_batch'          => ['required', 'boolean'],   // Batch printing process
            'is_printing'       => ['required', 'boolean'],
            'process_rate'      => ['nullable', 'numeric', 'min:0'],
            'transport_details' => ['nullable', 'string', 'max:255'],
            'gst_percent'       => ['nullable', 'numeric', 'min:0'],
            'grand_total'       => ['required', 'numeric', 'min:0'],
            'items'             => ['required', 'array', 'min:1'],
            'items.*.size'      => ['required', 'string', 'max:20'],
            'items.*.color'     => ['nullable', 'string', 'max:50'],
            'items.*.pieces'    => ['required', 'integer', 'min:0'],
            'items.*.rate'      => ['required', 'numeric', 'min:0'],
            'items.*.subtotal'  => ['required', 'numeric', 'min:0'],
        ]);

        $order = DB::transaction(function () use ($validated) {
            $order = Order::create([
                'party_id'          => $validated['party_id'],
                'item_name'         => $validated['item_name'],
                'is_embroidery'     => $validated['is_embroidery'],
                'is_batch'          => $validated['is_batch'],
                'is_printing'       => $validated['is_printing'],
                'process_rate'      => $validated['process_rate'] ?? 0,
                'transport_details' => $validated['transport_details'] ?? null,
                'gst_percent'       => $validated['gst_percent'] ?? 5,
                'grand_total'       => $validated['grand_total'],
            ]);

            // Only persist rows where pieces > 0 to avoid empty rows in the invoice.
            collect($validated['items'])
                ->filter(fn (array $item): bool => ($item['pieces'] ?? 0) > 0)
                ->each(function (array $item) use ($order): void {
                    $order->items()->create([
                        'size'     => $item['size'],
                        'color'    => $item['color'] ?? '',
                        'pieces'   => $item['pieces'],
                        'rate'     => $item['rate'],
                        'subtotal' => $item['subtotal'],
                    ]);
                });

            return $order;
        });

        return response()->json([
            'message'  => 'Order saved successfully.',
            'order_id' => $order->id,
            'pdf_url'  => route('orders.pdf', $order),
        ], 201);
    }

    /**
     * Generate and stream a PDF invoice for the given order.
     *
     * The Blade invoice template is rendered to an HTML string, then passed to
     * Browsershot which drives a headless Chrome instance to produce an A4 PDF.
     * The PDF is returned inline so the browser can display it in a new tab or
     * trigger the system print dialogue.
     *
     * Server prerequisite — Chrome/Chromium must be installed:
     *   Ubuntu: apt install chromium-browser
     *   macOS:  brew install --cask chromium
     */
    public function generatePdf(Order $order)
    {
        // Eager-load relations so the Blade view doesn't trigger N+1 queries.
        $order->load(['party', 'items']);

        $html = view('pdf.invoice', ['order' => $order])->render();

        $pdf = Browsershot::html($html)
            ->format('A4')
            ->showBackground()   // Preserve background colours/images from CSS
            ->pdf();

        return response($pdf, 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename=invoice-'.$order->id.'.pdf');
    }
}