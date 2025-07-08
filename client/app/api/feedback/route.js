import Database from 'better-sqlite3';

export const runtime = 'nodejs';

const db = new Database('feedback.db');
db.exec(`CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chatId TEXT,
  msgIdx INTEGER,
  rating INTEGER,
  ts INTEGER
)`);

export async function POST(req) {
  try {
    const { chatId, msgIdx, rating } = await req.json();
    if (!chatId || typeof msgIdx !== 'number' || ![-1,1].includes(rating)) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    db.prepare('INSERT INTO feedback (chatId, msgIdx, rating, ts) VALUES (?, ?, ?, ?)')
      .run(chatId, msgIdx, rating, Date.now());
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || e.toString() }), { status: 500 });
  }
}
