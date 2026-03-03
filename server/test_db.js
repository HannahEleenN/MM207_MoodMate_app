import Mood from './models/mood_server_model.mjs';

async function test() {
  try {
    const res = await Mood.create({ userId: 1, mood: 'glad', context: 'venner', note: 'db test', solution: 'klem', profileId: null });
    console.log('CREATE OK:', res);
  } catch (err) {
    console.error('Mood.create failed:', err);
  } finally {
    process.exit(0);
  }
}

test();

