import { Hono } from 'hono';
import type { RecurringProject } from '@/shared/types';

interface Env {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

// Get all recurring projects
app.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT rp.*, c.name as client_name
      FROM recurring_projects rp
      JOIN clients c ON rp.client_id = c.id
      ORDER BY rp.is_active DESC, rp.created_at DESC
    `).all();

    return c.json(results);
  } catch (error) {
    console.error('Error fetching recurring projects:', error);
    return c.json({ error: 'Failed to fetch recurring projects' }, 500);
  }
});

// Get recurring projects by client
app.get('/client/:clientId', async (c) => {
  const clientId = c.req.param('clientId');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT rp.*, c.name as client_name
      FROM recurring_projects rp
      JOIN clients c ON rp.client_id = c.id
      WHERE rp.client_id = ?
      ORDER BY rp.is_active DESC, rp.created_at DESC
    `).bind(clientId).all();

    return c.json(results);
  } catch (error) {
    console.error('Error fetching client recurring projects:', error);
    return c.json({ error: 'Failed to fetch recurring projects' }, 500);
  }
});

// Create recurring project
app.post('/', async (c) => {
  try {
    const body = await c.req.json<RecurringProject>();

    const result = await c.env.DB.prepare(`
      INSERT INTO recurring_projects (
        client_id, project_name, description, monthly_value,
        is_variable_value, start_date, end_date, is_active, payment_day, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.client_id,
      body.project_name,
      body.description || null,
      body.monthly_value || 0,  // Use 0 if not provided
      body.is_variable_value || 0,
      body.start_date || null,  // Also make start_date optional
      body.end_date || null,
      body.is_active !== undefined ? body.is_active : 1,
      body.payment_day || null,
      body.notes || null
    ).run();

    if (result.success) {
      return c.json({ id: result.meta.last_row_id }, 201);
    } else {
      return c.json({ error: 'Failed to create recurring project' }, 500);
    }
  } catch (error) {
    console.error('Error creating recurring project:', error);
    return c.json({ error: 'Failed to create recurring project' }, 500);
  }
});

// Update recurring project
app.put('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const body = await c.req.json<RecurringProject>();

    const result = await c.env.DB.prepare(`
      UPDATE recurring_projects
      SET project_name = ?,
          description = ?,
          monthly_value = ?,
          is_variable_value = ?,
          start_date = ?,
          end_date = ?,
          is_active = ?,
          payment_day = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      body.project_name,
      body.description || null,
      body.monthly_value || 0,  // Use 0 if not provided
      body.is_variable_value || 0,
      body.start_date || null,  // Also make start_date optional
      body.end_date || null,
      body.is_active,
      body.payment_day || null,
      body.notes || null,
      id
    ).run();

    if (result.success) {
      return c.json({ success: true });
    } else {
      return c.json({ error: 'Failed to update recurring project' }, 500);
    }
  } catch (error) {
    console.error('Error updating recurring project:', error);
    return c.json({ error: 'Failed to update recurring project' }, 500);
  }
});

// Delete recurring project
app.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const result = await c.env.DB.prepare(`
      DELETE FROM recurring_projects WHERE id = ?
    `).bind(id).run();

    if (result.success) {
      return c.json({ success: true });
    } else {
      return c.json({ error: 'Failed to delete recurring project' }, 500);
    }
  } catch (error) {
    console.error('Error deleting recurring project:', error);
    return c.json({ error: 'Failed to delete recurring project' }, 500);
  }
});

export default app;
