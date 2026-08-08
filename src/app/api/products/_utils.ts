import { NextResponse } from 'next/server'
import { NotFoundError, ValidationError } from '@/server/shared/errors'

export function handleServiceError(err: unknown): NextResponse {
  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 })
  }
  if (err instanceof ValidationError) {
    return NextResponse.json({ error: err.message, details: err.details }, { status: 400 })
  }
  console.error('[API Error]', err)
  return NextResponse.json({ error: 'خطای سرور' }, { status: 500 })
}
