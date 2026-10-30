import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';

export const forms = new Hono();

forms.post('/view-status-dismiss', async (c) => {
  return c.json<UiResponse>({}, 200);
});
