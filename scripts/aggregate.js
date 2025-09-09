const fs = require('fs');
const path = require('path');

function percentile(arr, p) {
  if (arr.length === 0) return null;
  const idx = Math.ceil((p / 100) * arr.length) - 1;
  return arr[Math.min(Math.max(idx, 0), arr.length - 1)];
}

function readAllJSONFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  let rows = [];
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      if (Array.isArray(data)) rows = rows.concat(data);
    } catch {}
  }
  return rows;
}

function findLatestResultDir(base='test-results') {
  if (!fs.existsSync(base)) return null;
  const entries = fs.readdirSync(base).map(name => {
    const p = path.join(base, name);
    const s = fs.statSync(p);
    return s.isDirectory() ? { name, mtime: s.mtimeMs, path: p } : null;
  }).filter(Boolean).sort((a,b)=>b.mtime-a.mtime);
  return entries[0]?.path || null;
}

(function main(){
  const latest = findLatestResultDir();
  if (!latest) {
    console.error('No test-results found.');
    process.exit(1);
  }
  const rows = readAllJSONFiles(latest);
  if (!rows.length) {
    console.error('No metrics_worker_*.json found in latest run.');
    process.exit(2);
  }

  const times = rows.map(r => r.elapsed_ms).filter(n => typeof n === 'number').sort((a,b)=>a-b);
  const total = times.length;
  const okCount = rows.filter(r => (r.status>=200 && r.status<400)).length;
  const errCount = total - okCount;

  const p50 = percentile(times,50);
  const p90 = percentile(times,90);
  const p95 = percentile(times,95);
  const p99 = percentile(times,99);
  const avg = total ? Math.round(times.reduce((a,b)=>a+b,0)/total) : null;
  const min = times[0] ?? null;
  const max = times[total-1] ?? null;

  const env = {
    users: process.env.USERS || '',
    duration: process.env.DURATION || '',
    target: process.env.TARGET_URL || ''
  };

  const header = [
    'timestamp','target','users','duration_sec',
    'samples','ok','errors',
    'min_ms','avg_ms','p50_ms','p90_ms','p95_ms','p99_ms','max_ms'
  ].join(',');
  const row = [
    new Date().toISOString(),
    env.target, env.users, env.duration,
    total, okCount, errCount,
    min, avg, p50, p90, p95, p99, max
  ].join(',');

  const outDir = 'reports';
  fs.mkdirSync(outDir, { recursive: true });
  const csvPath = path.join(outDir, 'load_summary.csv');
  if (!fs.existsSync(csvPath)) {
    fs.writeFileSync(csvPath, header + '\n' + row + '\n', 'utf8');
  } else {
    fs.appendFileSync(csvPath, row + '\n', 'utf8');
  }

  console.log('Wrote summary to', csvPath);
  console.log(row);
})();
