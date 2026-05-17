
import server from './server/index.js';

export default async function (request, event) {
  return server.fetch(request, {}, event);
}
