// Use the global fetch available in modern Node

const base = 'http://localhost:3000';

async function run() {
  try {
    const email = `testuser_${Date.now()}@example.com`;
    console.log('Registering', email);
    const regRes = await fetch(`${base}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: email, email, secret: 'pass123', hasConsented: true })
    });
    const regJson = await regRes.json().catch(() => ({ status: regRes.status }));
    console.log('Register response:', regJson);

    console.log('Logging in');
    const loginRes = await fetch(`${base}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, secret: 'pass123' })
    });
    const loginJson = await loginRes.json().catch(() => ({ status: loginRes.status }));
    console.log('Login response:', loginJson);

    if (!loginJson.token) {
      console.error('No token returned from login; aborting');
      process.exit(1);
    }

    const token = loginJson.token;

    console.log('Posting mood with solution');
    const moodRes = await fetch(`${base}/api/moods`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ mood: 'glad', context: 'venner', solution: 'klem', note: 'E2E test', profileId: null })
    });
    const moodJson = await moodRes.json().catch(() => ({ status: moodRes.status }));
    console.log('Mood response:', moodJson);

  } catch (err) {
    console.error('E2E test error:', err);
    process.exit(1);
  }
}

run();
