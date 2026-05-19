import { Hono } from 'hono';

interface Env {
  DB: D1Database;
}

const withdrawals = new Hono<{ Bindings: Env }>();

// Get withdrawal settings
withdrawals.get('/settings', async (c) => {
  try {
    const db = c.env.DB;
    const settings = await db.prepare('SELECT * FROM withdrawal_settings LIMIT 1').first();
    
    if (!settings) {
      // Create default settings if not exists
      const result = await db.prepare(
        'INSERT INTO withdrawal_settings (percentage) VALUES (?) RETURNING *'
      ).bind(40.0).first();
      return c.json(result);
    }
    
    return c.json(settings);
  } catch (error) {
    console.error('Error fetching withdrawal settings:', error);
    return c.json({ error: 'Failed to fetch settings' }, 500);
  }
});

// Update withdrawal settings
withdrawals.put('/settings', async (c) => {
  try {
    const { percentage } = await c.req.json();
    const db = c.env.DB;
    
    const result = await db.prepare(
      'UPDATE withdrawal_settings SET percentage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *'
    ).bind(percentage).first();
    
    return c.json(result);
  } catch (error) {
    console.error('Error updating withdrawal settings:', error);
    return c.json({ error: 'Failed to update settings' }, 500);
  }
});

// Get all withdrawals
withdrawals.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const month = c.req.query('month'); // Format: YYYY-MM
    
    let query = 'SELECT * FROM withdrawals';
    let params: any[] = [];
    
    if (month) {
      query += ' WHERE month_reference = ?';
      params.push(month);
    }
    
    query += ' ORDER BY withdrawal_date DESC';
    
    const stmt = params.length > 0 
      ? db.prepare(query).bind(...params)
      : db.prepare(query);
    
    const result = await stmt.all();
    return c.json(result.results || []);
  } catch (error) {
    console.error('Error fetching withdrawals:', error);
    return c.json({ error: 'Failed to fetch withdrawals' }, 500);
  }
});

// Create withdrawal
withdrawals.post('/', async (c) => {
  try {
    const { amount, withdrawal_date, month_reference, notes } = await c.req.json();
    const db = c.env.DB;
    
    // Insert withdrawal
    const withdrawal = await db.prepare(
      `INSERT INTO withdrawals (amount, withdrawal_date, month_reference, notes)
       VALUES (?, ?, ?, ?)
       RETURNING *`
    ).bind(amount, withdrawal_date, month_reference, notes || null).first();
    
    // Create cash transaction
    await db.prepare(
      `INSERT INTO cash_transactions (type, amount, description, category, transaction_date)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(
      'expense',
      amount,
      `Retirada de Lucro - ${month_reference}${notes ? ` - ${notes}` : ''}`,
      'Retirada de Lucro',
      withdrawal_date
    ).run();
    
    return c.json(withdrawal);
  } catch (error) {
    console.error('Error creating withdrawal:', error);
    return c.json({ error: 'Failed to create withdrawal' }, 500);
  }
});

// Delete withdrawal
withdrawals.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    // Get withdrawal details before deleting
    const withdrawal = await db.prepare('SELECT * FROM withdrawals WHERE id = ?')
      .bind(id).first();
    
    if (!withdrawal) {
      return c.json({ error: 'Withdrawal not found' }, 404);
    }
    
    // Delete withdrawal
    await db.prepare('DELETE FROM withdrawals WHERE id = ?').bind(id).run();
    
    // Note: We don't automatically delete the cash transaction to preserve financial history
    // User can manually delete from cash register if needed
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting withdrawal:', error);
    return c.json({ error: 'Failed to delete withdrawal' }, 500);
  }
});

// Get monthly revenue (from cash transactions)
withdrawals.get('/monthly-revenue/:month', async (c) => {
  try {
    const month = c.req.param('month'); // Format: YYYY-MM
    const db = c.env.DB;
    
    const result = await db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM cash_transactions
       WHERE type = 'income'
       AND strftime('%Y-%m', transaction_date) = ?`
    ).bind(month).first();
    
    return c.json({ revenue: result?.total || 0 });
  } catch (error) {
    console.error('Error fetching monthly revenue:', error);
    return c.json({ error: 'Failed to fetch revenue' }, 500);
  }
});

// Get monthly withdrawals total
withdrawals.get('/monthly-total/:month', async (c) => {
  try {
    const month = c.req.param('month'); // Format: YYYY-MM
    const db = c.env.DB;
    
    const result = await db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM withdrawals
       WHERE month_reference = ?`
    ).bind(month).first();
    
    return c.json({ total: result?.total || 0 });
  } catch (error) {
    console.error('Error fetching monthly withdrawals:', error);
    return c.json({ error: 'Failed to fetch withdrawals' }, 500);
  }
});

export default withdrawals;
