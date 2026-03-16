<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Billing Estimate #{{ $order->id }}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-white p-6 text-slate-900">
    @php
        $subtotal = $order->items->sum('subtotal');
        $totalPieces = $order->items->sum('pieces');
        $processSurcharge = $totalPieces * (float) $order->process_rate;
        $gstAmount = ($subtotal + $processSurcharge) * ((float) $order->gst_percent / 100);
    @endphp

    <div class="mx-auto max-w-[794px] border-2 border-slate-900">
        <div class="border-b-2 border-slate-900 px-6 py-4 text-center">
            <h1 class="text-3xl font-bold tracking-wide">SINGHAL SONS KNITWEAR</h1>
            <p class="mt-1 text-sm">GST NO: {{ $order->party->gst_no ?: 'N/A' }} · Ludhiana, Punjab</p>
            <p class="mt-2 text-lg font-semibold uppercase tracking-[0.25em]">Billing Estimate</p>
        </div>

        <div class="grid grid-cols-2 border-b border-slate-900 text-sm">
            <div class="border-r border-slate-900 p-3"><strong>Bill No:</strong> {{ $order->id }}</div>
            <div class="p-3"><strong>Date:</strong> {{ $order->created_at->format('d-m-Y') }}</div>
            <div class="border-r border-t border-slate-900 p-3"><strong>Party:</strong> {{ $order->party->name }}</div>
            <div class="border-t border-slate-900 p-3"><strong>City:</strong> {{ $order->party->city ?: 'N/A' }}</div>
            <div class="border-r border-t border-slate-900 p-3"><strong>Phone:</strong> {{ $order->party->phone ?: 'N/A' }}</div>
            <div class="border-t border-slate-900 p-3"><strong>Transport:</strong> {{ $order->transport_details ?: 'N/A' }}</div>
            <div class="border-r border-t border-slate-900 p-3"><strong>Item:</strong> {{ $order->item_name }}</div>
            <div class="border-t border-slate-900 p-3"><strong>Process:</strong> {{ $order->is_embroidery ? 'Embroidery' : ($order->is_printing ? 'Printing' : 'Standard') }}</div>
        </div>

        <table class="w-full border-collapse text-sm">
            <thead>
                <tr class="bg-slate-100">
                    <th class="border border-slate-900 px-3 py-2 text-left">Size</th>
                    <th class="border border-slate-900 px-3 py-2 text-left">Color</th>
                    <th class="border border-slate-900 px-3 py-2 text-right">Pieces</th>
                    <th class="border border-slate-900 px-3 py-2 text-right">Rate</th>
                    <th class="border border-slate-900 px-3 py-2 text-right">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($order->items as $item)
                    <tr>
                        <td class="border border-slate-900 px-3 py-2">{{ $item->size }}</td>
                        <td class="border border-slate-900 px-3 py-2">{{ $item->color }}</td>
                        <td class="border border-slate-900 px-3 py-2 text-right">{{ $item->pieces }}</td>
                        <td class="border border-slate-900 px-3 py-2 text-right">{{ number_format((float) $item->rate, 2) }}</td>
                        <td class="border border-slate-900 px-3 py-2 text-right">{{ number_format((float) $item->subtotal, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="grid grid-cols-2">
            <div class="border-r border-slate-900 p-4 text-sm leading-7">
                <p><strong>Terms & Notes</strong></p>
                <p>1. Advance 50% at booking.</p>
                <p>2. Balance payment before dispatch.</p>
                <p>3. Delivery timeline subject to raw material availability.</p>
                <p>4. Goods once sold will not be taken back.</p>
            </div>
            <div class="p-4">
                <table class="w-full text-sm">
                    <tbody>
                        <tr>
                            <td class="border border-slate-900 px-3 py-2 font-medium">Total Pieces</td>
                            <td class="border border-slate-900 px-3 py-2 text-right">{{ $totalPieces }}</td>
                        </tr>
                        <tr>
                            <td class="border border-slate-900 px-3 py-2 font-medium">Subtotal</td>
                            <td class="border border-slate-900 px-3 py-2 text-right">{{ number_format((float) $subtotal, 2) }}</td>
                        </tr>
                        <tr>
                            <td class="border border-slate-900 px-3 py-2 font-medium">Process Surcharge</td>
                            <td class="border border-slate-900 px-3 py-2 text-right">{{ number_format((float) $processSurcharge, 2) }}</td>
                        </tr>
                        <tr>
                            <td class="border border-slate-900 px-3 py-2 font-medium">GST {{ number_format((float) $order->gst_percent, 2) }}%</td>
                            <td class="border border-slate-900 px-3 py-2 text-right">{{ number_format((float) $gstAmount, 2) }}</td>
                        </tr>
                        <tr class="bg-slate-100">
                            <td class="border border-slate-900 px-3 py-2 text-base font-bold">Grand Total</td>
                            <td class="border border-slate-900 px-3 py-2 text-right text-base font-bold">{{ number_format((float) $order->grand_total, 2) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="grid grid-cols-2 border-t border-slate-900 text-sm">
            <div class="border-r border-slate-900 p-6">Receiver Signature</div>
            <div class="p-6 text-right font-semibold">For Singhal Sons Knitwear</div>
        </div>
    </div>
</body>
</html>