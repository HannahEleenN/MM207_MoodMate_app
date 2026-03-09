import { request } from 'http';

function fetchText(url)
{
    return new Promise((resolve, reject) =>
    {
        const req = request(url, res =>
        {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function run()
{
    const base = process.env.API_BASE || 'http://localhost:3000';
    console.log('Running smoke test against', base);
    try {
        const root = await fetchText(new URL('/', base));
        console.log('GET / ->', root.status);
        if (root.status !== 200) {
            console.error('Root did not return 200');
            process.exit(2);
        }
        if (!root.body.includes('MoodMate')) {
            console.warn('Root body does not include expected text "MoodMate"');
        }

        try {
            const manifest = await fetchText(new URL('/manifest.json', base));
            console.log('GET /manifest.json ->', manifest.status);
        } catch (e) {
            console.warn('Could not fetch /manifest.json:', e.message);
        }

        try {
            const flags = await fetchText(new URL('/assets/flags/flags.json', base));
            console.log('GET /assets/flags/flags.json ->', flags.status);
            if (flags.status === 200) {
                console.log('flags.json length', flags.body.length);
            }
        } catch (e) {
            console.warn('Could not fetch flags.json:', e.message);
        }

        console.log('Smoke test completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Smoke test failed:', err);
        process.exit(3);
    }
}

run();