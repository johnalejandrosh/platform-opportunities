import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const settings = db.getAllSettings();
  // Mask API keys in response
  return Response.json({
    ...settings,
    rapidapi_key: settings.rapidapi_key ? '••••••••' + settings.rapidapi_key.slice(-4) : '',
    github_token: settings.github_token ? '••••••••' + settings.github_token.slice(-4) : '',
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // Don't overwrite with masked value
      if (!value.startsWith('••••••••')) {
        db.setSetting(key, value);
      }
    } else {
      db.setSetting(key, JSON.stringify(value));
    }
  }
  return Response.json({ ok: true });
}
