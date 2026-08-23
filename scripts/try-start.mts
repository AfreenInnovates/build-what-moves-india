import 'dotenv/config';
import { startCase, loadCase } from '../lib/case';
try {
  const id = await startCase('ravi');
  console.log('startCase ->', id);
  const c = await loadCase(id!);
  console.log('loadCase  ->', c?.member.display_name, c?.resolution.totalDays, 'days',
              '| gates:', c?.resolution.gates.length, '| history:', c?.history.length);
} catch (e) {
  console.error('FAILED:', e);
}
process.exit(0);
