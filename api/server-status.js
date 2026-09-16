import { getStatusResponse } from '../worker/status.mjs';

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method ?? 'GET')) {
    response.setHeader('Allow', 'GET, HEAD');
    return response.status(405).send('Method not allowed');
  }

  const result = await getStatusResponse();
  result.headers.forEach((value, key) => response.setHeader(key, value));
  const body = await result.text();
  return response.status(result.status).send(request.method === 'HEAD' ? undefined : body);
}
