import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const apiKey = process.env.HUME_API_KEY || '';
  const secretKey = process.env.HUME_SECRET_KEY || '';

  if (!apiKey || !secretKey) {
    console.error('Hume credentials missing:', { hasApiKey: !!apiKey, hasSecretKey: !!secretKey });
    return NextResponse.json(
      { error: 'Hume credentials not configured' },
      { status: 500 }
    );
  }

  try {
    const authString = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');

    const response = await fetch('https://api.hume.ai/oauth2-cc/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Hume token error:', error);
      return NextResponse.json(
        { error: 'Failed to get Hume token', details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ accessToken: data.access_token });
  } catch (error: any) {
    console.error('Hume token error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
