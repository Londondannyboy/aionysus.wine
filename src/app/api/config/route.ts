import { NextResponse } from 'next/server'
import { getMerchantConfig } from '@/lib/wine-db'

export async function GET() {
  try {
    const config = await getMerchantConfig()
    return NextResponse.json({
      platformMode: config.platform_mode,
      availability: config.availability_label,
      shipping: config.shipping_label,
      shipsTo: config.shipping_country_code,
      returnPolicy: config.return_days > 0
        ? `${config.return_days}-day returns`
        : 'Returns not currently accepted (demo mode)',
      currency: config.price_currency,
      merchantName: config.merchant_name,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 })
  }
}
