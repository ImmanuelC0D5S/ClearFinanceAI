import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('Missing GOOGLE_API_KEY in env');
  process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error('Error listing models', res.status, body);
    process.exit(1);
  }
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

listModels().catch(err => { console.error(err); process.exit(1); });
