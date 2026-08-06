import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const filePath = () => path.join(process.cwd(), '.data', 'custom-emojis.json');
async function getEmojis() { try { return JSON.parse(await readFile(filePath(), 'utf8')) as string[]; } catch { return []; } }
export async function GET() { return NextResponse.json({ emojis: await getEmojis() }); }
export async function POST(request: Request) { const body = await request.json() as { emoji?: string }; const emoji = body.emoji?.trim(); if (!emoji || [...emoji].length > 8) return NextResponse.json({ message: 'ایموجی نامعتبر است' }, { status: 422 }); const emojis = await getEmojis(); const next = [...new Set([...emojis, emoji])]; await mkdir(path.dirname(filePath()), { recursive: true }); await writeFile(filePath(), JSON.stringify(next, null, 2), 'utf8'); return NextResponse.json({ emojis: next }); }
