import { Hono } from 'hono';

interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

const contracts = new Hono<{ Bindings: Env }>();

// --- ROTAS DE MODELOS (TEMPLATES) ---

contracts.get('/templates', async (c) => {
  try {
    const templates = await c.env.DB.prepare(`SELECT * FROM contract_templates ORDER BY is_default DESC, name ASC`).all();
    return c.json(templates.results || []);
  } catch (error) {
    return c.json({ error: 'Failed to fetch templates' }, 500);
  }
});

contracts.get('/templates/:id', async (c) => {
  try {
    const template = await c.env.DB.prepare(`SELECT * FROM contract_templates WHERE id = ?`).bind(c.req.param('id')).first();
    if (!template) return c.json({ error: 'Template not found' }, 404);
    return c.json(template);
  } catch (error) {
    return c.json({ error: 'Failed to fetch template' }, 500);
  }
});

contracts.post('/templates', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  try {
    if (body.is_default) await db.prepare(`UPDATE contract_templates SET is_default = 0 WHERE is_default = 1`).run();
    const result = await db.prepare(`INSERT INTO contract_templates (name, description, content, is_default, service_types) VALUES (?, ?, ?, ?, ?)`).bind(body.name, body.description || null, body.content, body.is_default ? 1 : 0, body.service_types || 'all').run();
    return c.json({ id: result.meta.last_row_id }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to create template' }, 500);
  }
});

contracts.put('/templates/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json();
  try {
    if (body.is_default) await db.prepare(`UPDATE contract_templates SET is_default = 0 WHERE is_default = 1 AND id != ?`).bind(id).run();
    await db.prepare(`UPDATE contract_templates SET name = ?, description = ?, content = ?, is_default = ?, service_types = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(body.name, body.description || null, body.content, body.is_default ? 1 : 0, body.service_types || 'all', id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update template' }, 500);
  }
});

contracts.delete('/templates/:id', async (c) => {
  try {
    const inUse = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM contracts WHERE template_id = ?`).bind(c.req.param('id')).first();
    if (inUse && (inUse as any).count > 0) return c.json({ error: 'Cannot delete template that is in use' }, 400);
    await c.env.DB.prepare(`DELETE FROM contract_templates WHERE id = ?`).bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete template' }, 500);
  }
});


// --- ROTAS DE CONTRATOS GERADOS ---

contracts.get('/', async (c) => {
  try {
    const results = await c.env.DB.prepare(`SELECT c.*, cl.name as client_name, q.quote_number, q.total as quote_total FROM contracts c JOIN quotes q ON c.quote_id = q.id JOIN clients cl ON q.client_id = cl.id ORDER BY c.created_at DESC`).all();
    return c.json(results.results || []);
  } catch (error) {
    return c.json({ error: 'Failed to fetch contracts' }, 500);
  }
});

contracts.get('/:id', async (c) => {
  try {
    const contract = await c.env.DB.prepare(`SELECT c.*, cl.name as client_name, cl.cpf_cnpj, cl.email, cl.address, cl.whatsapp, q.quote_number, q.total as quote_total, q.items as quote_items FROM contracts c JOIN quotes q ON c.quote_id = q.id JOIN clients cl ON q.client_id = cl.id WHERE c.id = ?`).bind(c.req.param('id')).first();
    if (!contract) return c.json({ error: 'Contract not found' }, 404);
    return c.json(contract);
  } catch (error) {
    return c.json({ error: 'Failed to fetch contract' }, 500);
  }
});

async function generateContractNumber(db: D1Database): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CONT-${year}-`;
  const lastContract = await db.prepare(`SELECT contract_number FROM contracts WHERE contract_number LIKE ? ORDER BY created_at DESC LIMIT 1`).bind(`${prefix}%`).first();
  let nextNumber = 1;
  if (lastContract) {
    const parts = (lastContract as any).contract_number.split('-');
    nextNumber = parseInt(parts[2]) + 1;
  }
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

contracts.post('/generate', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  try {
    const quote = await db.prepare(`SELECT q.*, cl.name as client_name, cl.cpf_cnpj, cl.email, cl.address, cl.whatsapp FROM quotes q JOIN clients cl ON q.client_id = cl.id WHERE q.id = ?`).bind(body.quote_id).first();
    if (!quote) return c.json({ error: 'Quote not found' }, 404);

    const items = JSON.parse((quote as any).items || '[]');
    const template = body.template_id 
      ? await db.prepare(`SELECT * FROM contract_templates WHERE id = ?`).bind(body.template_id).first()
      : await db.prepare(`SELECT * FROM contract_templates WHERE is_default = 1 LIMIT 1`).first();

    if (!template) return c.json({ error: 'No template found' }, 404);

    const servicesList = items.map((item: any) => {
      const name = item.name || item.description || 'Serviço';
      const needsQuantity = !name.includes('(') && !name.toLowerCase().includes('x');
      const quantityText = needsQuantity ? ` (${item.quantity || 1}x)` : '';
      return `- ${name}${quantityText} - R$ ${Number(item.price || 0).toFixed(2)}`;
    }).join('\n');

    const payments = await db.prepare(`SELECT * FROM payments WHERE quote_id = ? ORDER BY due_date ASC`).bind(body.quote_id).all();
    let paymentTerms = payments.results?.length 
      ? payments.results.map((p: any, i: number) => `Parcela ${i + 1}/${payments.results.length}: R$ ${Number(p.amount).toFixed(2)} - Vencimento: ${new Date(p.due_date).toLocaleDateString('pt-BR')}`).join('\n')
      : `Pagamento único de R$ ${Number((quote as any).total).toFixed(2)}`;

    let startDateBr = body.start_date || "";
    if (startDateBr.includes('-')) {
      const p = startDateBr.split('-');
      startDateBr = `${p[2]}/${p[1]}/${p[0]}`;
    }
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const hoje = new Date();
    const dataLonga = `${hoje.getDate()} de ${meses[hoje.getMonth()]} de ${hoje.getFullYear()}`;

    let content = (template as any).content;
    const totalValue = Number((quote as any).total || 0);
    const halfValue = totalValue / 2;
    const formatBRL = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const clientType = (quote as any).client_type || 'fisica';
    const clientTypeLabel = clientType === 'juridica' ? 'inscrita no CNPJ' : 'inscrito(a) no CPF';

    const replacements: Record<string, string> = {
      '{{client_name}}': (quote as any).client_name || '',
      '{{client_cpf_cnpj}}': (quote as any).cpf_cnpj || 'Não informado',
      '{{client_type_label}}': clientTypeLabel,
      '{{client_address}}': (quote as any).address || 'Não informado',
      '{{client_email}}': (quote as any).email || 'Não informado',
      '{{client_whatsapp}}': (quote as any).whatsapp || '',
      '{{services_list}}': servicesList,
      '{{total_value}}': formatBRL(totalValue),
      '{{half_value}}': formatBRL(halfValue),
      '{{payment_terms}}': paymentTerms,
      '{{start_date}}': startDateBr,
      '{{contract_date}}': new Date().toLocaleDateString('pt-BR'),
      '{{contract_date_long}}': dataLonga
    };

    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(key, 'g'), value);
    }

    const contractNumber = await generateContractNumber(db);
    const result = await db.prepare(`INSERT INTO contracts (quote_id, template_id, contract_number, content, status) VALUES (?, ?, ?, ?, 'draft')`).bind(body.quote_id, (template as any).id, contractNumber, content).run();

    return c.json({ id: result.meta.last_row_id, contract_number: contractNumber }, 201);
  } catch (error) {
    return c.json({ error: 'Failed to generate contract' }, 500);
  }
});

contracts.put('/:id', async (c) => {
  const body = await c.req.json();
  try {
    await c.env.DB.prepare(`UPDATE contracts SET content = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(body.content, body.status || 'draft', c.req.param('id')).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to update contract' }, 500);
  }
});

// --- ESTE É O BLOCO QUE ESTAVA FALTANDO ---
contracts.delete('/:id', async (c) => {
  try {
    await c.env.DB.prepare(`DELETE FROM contracts WHERE id = ?`).bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete contract' }, 500);
  }
});

export default contracts;
