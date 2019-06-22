/**
 * bulk-rename.js
 * Renames Redis keys in bulk, given a pattern to match and a string to replace it with.
 * Usage: REDIS_URL=redis://redis-instance-url node bulk-rename.js <pattern> <replacement>
 * 
 * (c) 2019 Jacob Cook
 */

const handyRedis = require('handy-redis');
const client = handyRedis.createHandyClient({ url: process.env.REDIS_URL });

async function run() {
  const result = await client.keys(process.argv[2]);
  const pattern = new RegExp(process.argv[3]);
  const replacement = process.argv[4] || '';

  console.log(`Set of ${result.length} scanned. Renaming...`);
  let cursor = 0;
  while (cursor <= result.length) {
    const batch = result.slice(cursor, cursor + 1000);
    const multi = client.multi();
    for (const i of batch.map(item => [item, item.replace(pattern, replacement)])) {
      multi.rename(i[0], i[1]);
    }
    const data = await client.execMulti(multi);
    console.log(`* Renamed batch ${cursor / 1000}: ${data.filter(res => res === 'OK').length}.`);
    cursor += 1000;
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
