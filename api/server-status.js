import { loadStatus } from '../worker/status.mjs';

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).send('Method not allowed');
  }

  try {
    const data = await loadStatus();
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    return response.status(200).send(request.method === 'HEAD' ? undefined : JSON.stringify(data));
  } catch (error) {
    console.error('server-status function failed', error);
    const now = new Date().toISOString();
    const data = { servers: [{ id: 'prime-1', name: '94.23.168.153:22097', subtitle: '94.23.168.153:22097', status: 'unknown', players: null, capacity: null, connectUrl: 'mtasa://94.23.168.153:22097', statusMessage: 'Моніторинг тимчасово недоступний.', checkedAt: now }], checkedAt: now };
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    return response.status(200).send(request.method === 'HEAD' ? undefined : JSON.stringify(data));
  }
}
