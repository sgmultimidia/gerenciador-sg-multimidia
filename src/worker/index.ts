import { Hono } from "hono";
import { cors } from "hono/cors";
import withdrawals from "../api/routes/withdrawals";
import recurringProjects from "./routes/recurring-projects";
import contracts from "./routes/contracts";
import { cleanupArchivedQuotes } from "../api/cron/cleanup-archived-quotes";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors());

// Mount withdrawals routes
app.route("/api/withdrawals", withdrawals);

// Mount recurring projects routes
app.route("/api/recurring-projects", recurringProjects);

// Mount contracts routes
app.route("/api/contracts", contracts);

// GET all clients
app.get("/api/clients", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM clients ORDER BY is_favorite DESC, name ASC"
    ).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

// POST new client or update existing client
app.post("/api/clients", async (c) => {
  try {
    const body = await c.req.json();
    const { id, name, whatsapp, client_type, cpf_cnpj, email, address, contact, phone_notes, is_favorite, logo_url, tags, instagram, facebook, internal_notes } = body;
    
    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    if (id) {
      // Update existing client
      const result = await c.env.DB.prepare(
        "UPDATE clients SET name = ?, whatsapp = ?, client_type = ?, cpf_cnpj = ?, email = ?, address = ?, contact = ?, phone_notes = ?, is_favorite = ?, logo_url = ?, tags = ?, instagram = ?, facebook = ?, internal_notes = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(
        name,
        whatsapp || contact || '',
        client_type || null,
        cpf_cnpj || null,
        email || null,
        address || null,
        contact || whatsapp || '',
        phone_notes || null,
        is_favorite ? 1 : 0,
        logo_url || null,
        tags || null,
        instagram || null,
        facebook || null,
        internal_notes || null,
        id
      ).run();

      if (!result.success) {
        return c.json({ error: "Failed to update client" }, 500);
      }

      const updatedClient = await c.env.DB.prepare(
        "SELECT * FROM clients WHERE id = ?"
      ).bind(id).first();

      return c.json(updatedClient, 200);
    } else {
      // Create new client
      const result = await c.env.DB.prepare(
        "INSERT INTO clients (name, whatsapp, client_type, cpf_cnpj, email, address, contact, phone_notes, is_favorite, logo_url, tags, instagram, facebook, internal_notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
      ).bind(
        name,
        whatsapp || contact || '',
        client_type || null,
        cpf_cnpj || null,
        email || null,
        address || null,
        contact || whatsapp || '',
        phone_notes || null,
        is_favorite ? 1 : 0,
        logo_url || null,
        tags || null,
        instagram || null,
        facebook || null,
        internal_notes || null
      ).run();

      if (!result.success) {
        return c.json({ error: "Failed to create client" }, 500);
      }

      const newClient = await c.env.DB.prepare(
        "SELECT * FROM clients WHERE id = ?"
      ).bind(result.meta.last_row_id).first();

      return c.json(newClient, 201);
    }
  } catch (error) {
    return c.json({ error: "Failed to create/update client" }, 500);
  }
});

// PUT update client
app.put("/api/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, whatsapp, client_type, cpf_cnpj, email, address, contact, phone_notes, is_favorite, logo_url, tags, instagram, facebook, internal_notes } = body;
    
    if (!name) {
      return c.json({ error: "Name is required" }, 400);
    }

    const result = await c.env.DB.prepare(
      "UPDATE clients SET name = ?, whatsapp = ?, client_type = ?, cpf_cnpj = ?, email = ?, address = ?, contact = ?, phone_notes = ?, is_favorite = ?, logo_url = ?, tags = ?, instagram = ?, facebook = ?, internal_notes = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(
      name,
      whatsapp || contact || '',
      client_type || null,
      cpf_cnpj || null,
      email || null,
      address || null,
      contact || whatsapp || '',
      phone_notes || null,
      is_favorite ? 1 : 0,
      logo_url || null,
      tags || null,
      instagram || null,
      facebook || null,
      internal_notes || null,
      id
    ).run();

    if (!result.success) {
      return c.json({ error: "Failed to update client" }, 500);
    }

    const updatedClient = await c.env.DB.prepare(
      "SELECT * FROM clients WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedClient);
  } catch (error) {
    return c.json({ error: "Failed to update client" }, 500);
  }
});

// DELETE client
app.delete("/api/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(
      "DELETE FROM clients WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Failed to delete client" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

// POST new quote
app.post("/api/quotes", async (c) => {
  try {
    const body = await c.req.json();
    const { client_id, items, subtotal, discount_percentage, discount_value, total } = body;
    
    if (!client_id || !items || subtotal === undefined || total === undefined) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // Generate simple sequential quote number (001, 002, 003, etc.)
    // Use MAX instead of COUNT to handle deleted quotes properly
    const maxResult = await c.env.DB.prepare(
      "SELECT MAX(CAST(quote_number AS INTEGER)) as max_number FROM quotes"
    ).first() as any;
    
    const nextNumber = (maxResult?.max_number || 0) + 1;
    const quoteNumber = String(nextNumber).padStart(3, '0');
    
    // Insert quote
    const result = await c.env.DB.prepare(
      "INSERT INTO quotes (client_id, quote_number, items, subtotal, discount_percentage, discount_value, total, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))"
    ).bind(
      client_id,
      quoteNumber,
      JSON.stringify(items),
      subtotal,
      discount_percentage || 0,
      discount_value || 0,
      total
    ).run();

    if (!result.success) {
      return c.json({ error: "Failed to create quote" }, 500);
    }

    const newQuote = await c.env.DB.prepare(
      "SELECT id, client_id, quote_number, items, subtotal, discount_percentage, discount_value, total, status, created_at, updated_at FROM quotes WHERE id = ?"
    ).bind(result.meta.last_row_id).first() as any;

    // Parse items back to JSON
    if (newQuote && newQuote.items) {
      newQuote.items = JSON.parse(newQuote.items as string);
    }

    return c.json(newQuote, 201);
  } catch (error) {
    return c.json({ error: "Failed to create quote" }, 500);
  }
});

// GET quotes by client ID
app.get("/api/quotes/client/:clientId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    
    const result = await c.env.DB.prepare(
      "SELECT id, client_id, quote_number, items, subtotal, discount_percentage, discount_value, total, status, created_at, updated_at FROM quotes WHERE client_id = ? AND archived_at IS NULL ORDER BY created_at DESC"
    ).bind(clientId).all();
    
    const quotes = (result.results || []).map((quote: any) => {
      if (quote.items) {
        quote.items = JSON.parse(quote.items);
      }
      return quote;
    });
    
    return c.json(quotes);
  } catch (error) {
    return c.json({ error: "Failed to fetch quotes" }, 500);
  }
});

// POST approve quote
app.post("/api/quotes/:id/approve", async (c) => {
  try {
    const quoteId = c.req.param("id");
    
    // Get the quote to find the client_id
    const quote = await c.env.DB.prepare(
      "SELECT client_id, status FROM quotes WHERE id = ?"
    ).bind(quoteId).first() as any;
    
    if (!quote) {
      return c.json({ error: "Quote not found" }, 404);
    }
    
    if (quote.status === 'approved') {
      return c.json({ error: "Quote is already approved" }, 400);
    }
    
    // Archive all other pending quotes for this client instead of deleting
    await c.env.DB.prepare(
      "UPDATE quotes SET archived_at = datetime('now'), updated_at = datetime('now') WHERE client_id = ? AND id != ? AND status = 'pending' AND archived_at IS NULL"
    ).bind(quote.client_id, quoteId).run();
    
    // Update this quote to approved
    const result = await c.env.DB.prepare(
      "UPDATE quotes SET status = 'approved', updated_at = datetime('now') WHERE id = ?"
    ).bind(quoteId).run();
    
    if (!result.success) {
      return c.json({ error: "Failed to approve quote" }, 500);
    }
    
    // Automatically create project in project manager
    const existingProject = await c.env.DB.prepare(
      "SELECT id FROM project_status WHERE quote_id = ?"
    ).bind(quoteId).first();
    
    if (!existingProject) {
      await c.env.DB.prepare(
        "INSERT INTO project_status (quote_id, status, progress, estimated_delivery, notes, created_at, updated_at) VALUES (?, 'not_started', 0, NULL, 'Projeto criado automaticamente após aprovação do orçamento', datetime('now'), datetime('now'))"
      ).bind(quoteId).run();
    }
    
    // Return updated quote
    const updatedQuote = await c.env.DB.prepare(
      "SELECT id, client_id, quote_number, items, subtotal, discount_percentage, discount_value, total, status, created_at, updated_at FROM quotes WHERE id = ?"
    ).bind(quoteId).first() as any;
    
    if (updatedQuote && updatedQuote.items) {
      updatedQuote.items = JSON.parse(updatedQuote.items as string);
    }
    
    return c.json(updatedQuote);
  } catch (error) {
    return c.json({ error: "Failed to approve quote" }, 500);
  }
});

// GET all quotes
app.get("/api/quotes", async (c) => {
  try {
    const search = c.req.query("search") || "";
    
    let query = "SELECT q.id, q.client_id, q.quote_number, q.items, q.subtotal, q.discount_percentage, q.discount_value, q.total, q.status, q.created_at, q.updated_at, c.name as client_name FROM quotes q JOIN clients c ON q.client_id = c.id WHERE q.archived_at IS NULL";
    
    if (search) {
      query += " AND (c.name LIKE ? OR q.quote_number LIKE ?)";
    }
    
    query += " ORDER BY q.created_at DESC";
    
    const preparedQuery = c.env.DB.prepare(query);
    const result = search 
      ? await preparedQuery.bind(`%${search}%`, `%${search}%`).all()
      : await preparedQuery.all();
    
    const quotes = (result.results || []).map((quote: any) => {
      if (quote.items) {
        quote.items = JSON.parse(quote.items);
      }
      return quote;
    });
    
    return c.json(quotes);
  } catch (error) {
    return c.json({ error: "Failed to fetch quotes" }, 500);
  }
});

// DELETE quote
app.delete("/api/quotes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(
      "DELETE FROM quotes WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Failed to delete quote" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete quote" }, 500);
  }
});

// POST create appointment
app.post("/api/appointments", async (c) => {
  try {
    const body = await c.req.json();
    const { client_id, service_name, service_type, appointment_date, appointment_time, duration_hours, notes } = body;
    
    if (!client_id || !service_name || !service_type || !appointment_date || !appointment_time || !duration_hours) {
      return c.json({ error: "Campos obrigatórios faltando" }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO appointments (client_id, service_name, service_type, appointment_date, appointment_time, duration_hours, status, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), datetime('now'))"
    ).bind(client_id, service_name, service_type, appointment_date, appointment_time, duration_hours, notes || null).run();

    if (!result.success) {
      return c.json({ error: "Falha ao criar agendamento" }, 500);
    }

    const newAppointment = await c.env.DB.prepare(
      "SELECT * FROM appointments WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newAppointment, 201);
  } catch (error) {
    return c.json({ error: "Falha ao criar agendamento" }, 500);
  }
});

// GET all appointments
app.get("/api/appointments", async (c) => {
  try {
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    const clientId = c.req.query("client_id");
    
    let query = "SELECT a.*, c.name as client_name FROM appointments a JOIN clients c ON a.client_id = c.id WHERE 1=1";
    const params: any[] = [];
    
    if (startDate) {
      query += " AND a.appointment_date >= ?";
      params.push(startDate);
    }
    
    if (endDate) {
      query += " AND a.appointment_date <= ?";
      params.push(endDate);
    }
    
    if (clientId) {
      query += " AND a.client_id = ?";
      params.push(clientId);
    }
    
    query += " ORDER BY a.appointment_date ASC, a.appointment_time ASC";
    
    const preparedQuery = c.env.DB.prepare(query);
    const result = params.length > 0 
      ? await preparedQuery.bind(...params).all()
      : await preparedQuery.all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Falha ao buscar agendamentos" }, 500);
  }
});

// PUT update appointment
app.put("/api/appointments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { service_name, service_type, appointment_date, appointment_time, duration_hours, status, notes } = body;
    
    const result = await c.env.DB.prepare(
      "UPDATE appointments SET service_name = ?, service_type = ?, appointment_date = ?, appointment_time = ?, duration_hours = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(service_name, service_type, appointment_date, appointment_time, duration_hours, status, notes || null, id).run();

    if (!result.success) {
      return c.json({ error: "Falha ao atualizar agendamento" }, 500);
    }

    const updatedAppointment = await c.env.DB.prepare(
      "SELECT * FROM appointments WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedAppointment);
  } catch (error) {
    return c.json({ error: "Falha ao atualizar agendamento" }, 500);
  }
});

// DELETE appointment
app.delete("/api/appointments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(
      "DELETE FROM appointments WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Falha ao excluir agendamento" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Falha ao excluir agendamento" }, 500);
  }
});

// POST create receipt
app.post("/api/receipts", async (c) => {
  try {
    const body = await c.req.json();
    const { quote_id, overtime_minutes, overtime_value, final_total } = body;
    
    if (!quote_id || final_total === undefined) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO receipts (quote_id, overtime_minutes, overtime_value, final_total, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).bind(
      quote_id,
      overtime_minutes || 0,
      overtime_value || 0,
      final_total
    ).run();

    if (!result.success) {
      return c.json({ error: "Failed to create receipt" }, 500);
    }

    const newReceipt = await c.env.DB.prepare(
      "SELECT id, quote_id, overtime_minutes, overtime_value, final_total, created_at, updated_at FROM receipts WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newReceipt, 201);
  } catch (error) {
    return c.json({ error: "Failed to create receipt" }, 500);
  }
});

// GET receipts by quote ID
app.get("/api/receipts/quote/:quoteId", async (c) => {
  try {
    const quoteId = c.req.param("quoteId");
    
    const result = await c.env.DB.prepare(
      "SELECT id, quote_id, overtime_minutes, overtime_value, final_total, created_at, updated_at FROM receipts WHERE quote_id = ? ORDER BY created_at DESC"
    ).bind(quoteId).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Failed to fetch receipts" }, 500);
  }
});

// POST create monthly receipt
app.post("/api/monthly-receipts", async (c) => {
  try {
    const body = await c.req.json();
    const { client_id, amount, description, month_reference } = body;
    
    if (!client_id || !amount || !description || !month_reference) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO monthly_receipts (client_id, amount, description, month_reference, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).bind(client_id, amount, description, month_reference).run();

    if (!result.success) {
      return c.json({ error: "Failed to create monthly receipt" }, 500);
    }

    const newReceipt = await c.env.DB.prepare(
      "SELECT * FROM monthly_receipts WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newReceipt, 201);
  } catch (error) {
    return c.json({ error: "Failed to create monthly receipt" }, 500);
  }
});

// GET monthly receipts by client ID
app.get("/api/monthly-receipts/client/:clientId", async (c) => {
  try {
    const clientId = c.req.param("clientId");
    
    const result = await c.env.DB.prepare(
      "SELECT * FROM monthly_receipts WHERE client_id = ? ORDER BY created_at DESC"
    ).bind(clientId).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Failed to fetch monthly receipts" }, 500);
  }
});

// DELETE monthly receipt
app.delete("/api/monthly-receipts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Delete associated cash transaction first (if exists)
    await c.env.DB.prepare(
      "DELETE FROM cash_transactions WHERE receipt_id = ? AND category = 'Recibo Mensal'"
    ).bind(id).run();
    
    // Delete the monthly receipt
    const result = await c.env.DB.prepare(
      "DELETE FROM monthly_receipts WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Failed to delete monthly receipt" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete monthly receipt" }, 500);
  }
});

// DELETE receipt
app.delete("/api/receipts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Delete associated cash transaction first (if exists)
    await c.env.DB.prepare(
      "DELETE FROM cash_transactions WHERE receipt_id = ?"
    ).bind(id).run();
    
    // Delete the receipt
    const result = await c.env.DB.prepare(
      "DELETE FROM receipts WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Failed to delete receipt" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete receipt" }, 500);
  }
});

// POST create cash transaction
app.post("/api/cash-transactions", async (c) => {
  try {
    const body = await c.req.json();
    const { type, amount, description, category, client_id, quote_id, receipt_id, payment_method, transaction_date } = body;
    
    if (!type || !amount || !description || !transaction_date) {
      return c.json({ error: "Campos obrigatórios faltando" }, 400);
    }

    if (type !== 'income' && type !== 'expense') {
      return c.json({ error: "Tipo deve ser 'income' ou 'expense'" }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO cash_transactions (type, amount, description, category, client_id, quote_id, receipt_id, payment_method, transaction_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).bind(
      type,
      amount,
      description,
      category || null,
      client_id || null,
      quote_id || null,
      receipt_id || null,
      payment_method || null,
      transaction_date
    ).run();

    if (!result.success) {
      return c.json({ error: "Falha ao criar transação" }, 500);
    }

    const newTransaction = await c.env.DB.prepare(
      "SELECT * FROM cash_transactions WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newTransaction, 201);
  } catch (error) {
    return c.json({ error: "Falha ao criar transação" }, 500);
  }
});

// GET all cash transactions
app.get("/api/cash-transactions", async (c) => {
  try {
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    const type = c.req.query("type");
    
    let query = "SELECT ct.*, c.name as client_name FROM cash_transactions ct LEFT JOIN clients c ON ct.client_id = c.id WHERE 1=1";
    const params: any[] = [];
    
    if (startDate) {
      query += " AND ct.transaction_date >= ?";
      params.push(startDate);
    }
    
    if (endDate) {
      query += " AND ct.transaction_date <= ?";
      params.push(endDate);
    }
    
    if (type && (type === 'income' || type === 'expense')) {
      query += " AND ct.type = ?";
      params.push(type);
    }
    
    query += " ORDER BY ct.transaction_date DESC, ct.created_at DESC";
    
    const preparedQuery = c.env.DB.prepare(query);
    const result = params.length > 0 
      ? await preparedQuery.bind(...params).all()
      : await preparedQuery.all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Falha ao buscar transações" }, 500);
  }
});

// GET cash balance
app.get("/api/cash-balance", async (c) => {
  try {
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    let query = "SELECT type, SUM(amount) as total FROM cash_transactions WHERE 1=1";
    const params: any[] = [];
    
    if (startDate) {
      query += " AND transaction_date >= ?";
      params.push(startDate);
    }
    
    if (endDate) {
      query += " AND transaction_date <= ?";
      params.push(endDate);
    }
    
    query += " GROUP BY type";
    
    const preparedQuery = c.env.DB.prepare(query);
    const result = params.length > 0 
      ? await preparedQuery.bind(...params).all()
      : await preparedQuery.all();
    
    const data = result.results || [];
    const income = (data.find((r: any) => r.type === 'income') as any)?.total || 0;
    const expense = (data.find((r: any) => r.type === 'expense') as any)?.total || 0;
    const balance = income - expense;
    
    return c.json({
      income,
      expense,
      balance
    });
  } catch (error) {
    return c.json({ error: "Falha ao buscar saldo" }, 500);
  }
});

// PUT update cash transaction
app.put("/api/cash-transactions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { type, amount, description, category, payment_method, transaction_date } = body;
    
    if (!type || !amount || !description || !transaction_date) {
      return c.json({ error: "Campos obrigatórios faltando" }, 400);
    }

    if (type !== 'income' && type !== 'expense') {
      return c.json({ error: "Tipo deve ser 'income' ou 'expense'" }, 400);
    }
    
    const result = await c.env.DB.prepare(
      "UPDATE cash_transactions SET type = ?, amount = ?, description = ?, category = ?, payment_method = ?, transaction_date = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(type, amount, description, category || null, payment_method || null, transaction_date, id).run();

    if (!result.success) {
      return c.json({ error: "Falha ao atualizar transação" }, 500);
    }

    const updatedTransaction = await c.env.DB.prepare(
      "SELECT * FROM cash_transactions WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedTransaction);
  } catch (error) {
    return c.json({ error: "Falha ao atualizar transação" }, 500);
  }
});

// DELETE cash transaction
app.delete("/api/cash-transactions/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(
      "DELETE FROM cash_transactions WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Falha ao excluir transação" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Falha ao excluir transação" }, 500);
  }
});

// GET dashboard analytics
app.get("/api/analytics/dashboard", async (c) => {
  try {
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    // Monthly revenue from cash transactions
    let revenueQuery = `
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM cash_transactions
      WHERE 1=1
    `;
    const revenueParams: any[] = [];
    
    if (startDate) {
      revenueQuery += " AND transaction_date >= ?";
      revenueParams.push(startDate);
    }
    
    if (endDate) {
      revenueQuery += " AND transaction_date <= ?";
      revenueParams.push(endDate);
    }
    
    revenueQuery += " GROUP BY month ORDER BY month DESC LIMIT 12";
    
    const revenueResult = revenueParams.length > 0
      ? await c.env.DB.prepare(revenueQuery).bind(...revenueParams).all()
      : await c.env.DB.prepare(revenueQuery).all();
    
    // Top services from quotes
    let servicesQuery = `
      SELECT 
        json_extract(value, '$.name') as service_name,
        COUNT(*) as count,
        SUM(CAST(json_extract(value, '$.price') AS REAL)) as total_revenue
      FROM quotes, json_each(items)
      WHERE status = 'approved'
    `;
    const servicesParams: any[] = [];
    
    if (startDate) {
      servicesQuery += " AND created_at >= ?";
      servicesParams.push(startDate);
    }
    
    if (endDate) {
      servicesQuery += " AND created_at <= ?";
      servicesParams.push(endDate);
    }
    
    servicesQuery += " GROUP BY service_name ORDER BY count DESC LIMIT 10";
    
    const servicesResult = servicesParams.length > 0
      ? await c.env.DB.prepare(servicesQuery).bind(...servicesParams).all()
      : await c.env.DB.prepare(servicesQuery).all();
    
    // Top clients by revenue
    let clientsQuery = `
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT q.id) as quote_count,
        SUM(q.total) as total_revenue
      FROM clients c
      JOIN quotes q ON c.id = q.client_id
      WHERE q.status = 'approved'
    `;
    const clientsParams: any[] = [];
    
    if (startDate) {
      clientsQuery += " AND q.created_at >= ?";
      clientsParams.push(startDate);
    }
    
    if (endDate) {
      clientsQuery += " AND q.created_at <= ?";
      clientsParams.push(endDate);
    }
    
    clientsQuery += " GROUP BY c.id, c.name ORDER BY total_revenue DESC LIMIT 10";
    
    const clientsResult = clientsParams.length > 0
      ? await c.env.DB.prepare(clientsQuery).bind(...clientsParams).all()
      : await c.env.DB.prepare(clientsQuery).all();
    
    // Overall stats
    let statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM clients) as total_clients,
        (SELECT COUNT(*) FROM quotes WHERE status = 'approved') as approved_quotes,
        (SELECT COUNT(*) FROM quotes WHERE status = 'pending') as pending_quotes,
        (SELECT COUNT(*) FROM appointments WHERE status = 'pending') as upcoming_appointments,
        (SELECT SUM(amount) FROM cash_transactions WHERE type = 'income'` +
        (startDate ? ` AND transaction_date >= ?` : ``) +
        (endDate ? ` AND transaction_date <= ?` : ``) + `) as total_income,
        (SELECT SUM(amount) FROM cash_transactions WHERE type = 'expense'` +
        (startDate ? ` AND transaction_date >= ?` : ``) +
        (endDate ? ` AND transaction_date <= ?` : ``) + `) as total_expense
    `;
    
    const statsParams: any[] = [];
    if (startDate) {
      statsParams.push(startDate);
      if (endDate) statsParams.push(endDate);
    }
    if (startDate && endDate) {
      statsParams.push(startDate);
      statsParams.push(endDate);
    }
    
    const statsResult = statsParams.length > 0
      ? await c.env.DB.prepare(statsQuery).bind(...statsParams).first()
      : await c.env.DB.prepare(statsQuery).first();
    
    return c.json({
      revenue: revenueResult.results || [],
      topServices: servicesResult.results || [],
      topClients: clientsResult.results || [],
      stats: statsResult || {}
    });
  } catch (error) {
    return c.json({ error: "Falha ao buscar analytics" }, 500);
  }
});

// PAYMENTS ENDPOINTS

// POST create payment
app.post("/api/payments", async (c) => {
  try {
    const body = await c.req.json();
    const { quote_id, amount, due_date, payment_method, status, installment_number, total_installments, notes } = body;
    
    if (!quote_id || !amount || !due_date || !status) {
      return c.json({ error: "Campos obrigatórios faltando" }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO payments (quote_id, amount, due_date, payment_method, status, installment_number, total_installments, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).bind(quote_id, amount, due_date, payment_method || null, status, installment_number || null, total_installments || null, notes || null).run();

    if (!result.success) {
      return c.json({ error: "Falha ao criar pagamento" }, 500);
    }

    const newPayment = await c.env.DB.prepare(
      "SELECT * FROM payments WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newPayment, 201);
  } catch (error) {
    return c.json({ error: "Falha ao criar pagamento" }, 500);
  }
});

// GET payments by quote ID
app.get("/api/payments/quote/:quoteId", async (c) => {
  try {
    const quoteId = c.req.param("quoteId");
    
    const result = await c.env.DB.prepare(
      "SELECT * FROM payments WHERE quote_id = ? ORDER BY due_date ASC"
    ).bind(quoteId).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Falha ao buscar pagamentos" }, 500);
  }
});

// GET all payments
app.get("/api/payments", async (c) => {
  try {
    const status = c.req.query("status");
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    let query = "SELECT p.*, q.quote_number, c.name as client_name FROM payments p JOIN quotes q ON p.quote_id = q.id JOIN clients c ON q.client_id = c.id WHERE 1=1";
    const params: any[] = [];
    
    if (status) {
      query += " AND p.status = ?";
      params.push(status);
    }
    
    if (startDate) {
      query += " AND p.due_date >= ?";
      params.push(startDate);
    }
    
    if (endDate) {
      query += " AND p.due_date <= ?";
      params.push(endDate);
    }
    
    query += " ORDER BY p.due_date ASC";
    
    const preparedQuery = c.env.DB.prepare(query);
    const result = params.length > 0 
      ? await preparedQuery.bind(...params).all()
      : await preparedQuery.all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Falha ao buscar pagamentos" }, 500);
  }
});

// PUT update payment
app.put("/api/payments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { amount, due_date, paid_date, payment_method, status, notes } = body;
    
    const result = await c.env.DB.prepare(
      "UPDATE payments SET amount = ?, due_date = ?, paid_date = ?, payment_method = ?, status = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(amount, due_date, paid_date || null, payment_method || null, status, notes || null, id).run();

    if (!result.success) {
      return c.json({ error: "Falha ao atualizar pagamento" }, 500);
    }

    const updatedPayment = await c.env.DB.prepare(
      "SELECT * FROM payments WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedPayment);
  } catch (error) {
    return c.json({ error: "Falha ao atualizar pagamento" }, 500);
  }
});

// DELETE payment
app.delete("/api/payments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(
      "DELETE FROM payments WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Falha ao excluir pagamento" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Falha ao excluir pagamento" }, 500);
  }
});

// PROJECT STATUS ENDPOINTS

// POST create project status
app.post("/api/project-status", async (c) => {
  try {
    const body = await c.req.json();
    const { quote_id, status, progress, estimated_delivery, notes } = body;
    
    if (!quote_id || !status) {
      return c.json({ error: "Campos obrigatórios faltando" }, 400);
    }

    const result = await c.env.DB.prepare(
      "INSERT INTO project_status (quote_id, status, progress, estimated_delivery, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).bind(quote_id, status, progress || 0, estimated_delivery || null, notes || null).run();

    if (!result.success) {
      return c.json({ error: "Falha ao criar status do projeto" }, 500);
    }

    const newStatus = await c.env.DB.prepare(
      "SELECT * FROM project_status WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newStatus, 201);
  } catch (error) {
    return c.json({ error: "Falha ao criar status do projeto" }, 500);
  }
});

// GET project status by quote ID
app.get("/api/project-status/quote/:quoteId", async (c) => {
  try {
    const quoteId = c.req.param("quoteId");
    
    const result = await c.env.DB.prepare(
      "SELECT * FROM project_status WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1"
    ).bind(quoteId).first();
    
    return c.json(result || null);
  } catch (error) {
    return c.json({ error: "Falha ao buscar status do projeto" }, 500);
  }
});

// GET all project statuses
app.get("/api/project-status", async (c) => {
  try {
    const status = c.req.query("status");
    
    let query = "SELECT ps.*, q.quote_number, c.name as client_name FROM project_status ps JOIN quotes q ON ps.quote_id = q.id JOIN clients c ON q.client_id = c.id WHERE 1=1";
    const params: any[] = [];
    
    if (status) {
      query += " AND ps.status = ?";
      params.push(status);
    }
    
    query += " ORDER BY ps.updated_at DESC";
    
    const preparedQuery = c.env.DB.prepare(query);
    const result = params.length > 0 
      ? await preparedQuery.bind(...params).all()
      : await preparedQuery.all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Falha ao buscar status dos projetos" }, 500);
  }
});

// PUT update project status
app.put("/api/project-status/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { status, progress, estimated_delivery, actual_delivery, notes } = body;
    
    const result = await c.env.DB.prepare(
      "UPDATE project_status SET status = ?, progress = ?, estimated_delivery = ?, actual_delivery = ?, notes = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(status, progress, estimated_delivery || null, actual_delivery || null, notes || null, id).run();

    if (!result.success) {
      return c.json({ error: "Falha ao atualizar status do projeto" }, 500);
    }

    const updatedStatus = await c.env.DB.prepare(
      "SELECT * FROM project_status WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedStatus);
  } catch (error) {
    return c.json({ error: "Falha ao atualizar status do projeto" }, 500);
  }
});

// GET financial report
app.get("/api/analytics/financial-report", async (c) => {
  try {
    const startDate = c.req.query("start_date");
    const endDate = c.req.query("end_date");
    
    if (!startDate || !endDate) {
      return c.json({ error: "Datas de início e fim são obrigatórias" }, 400);
    }
    
    // Monthly revenue
    const monthlyRevenueResult = await c.env.DB.prepare(
      `SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as profit
      FROM cash_transactions
      WHERE transaction_date BETWEEN ? AND ?
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month ASC`
    ).bind(startDate, endDate).all();
    
    // Category breakdown (expenses only)
    const categoryResult = await c.env.DB.prepare(
      `SELECT 
        category,
        SUM(amount) as amount
      FROM cash_transactions
      WHERE type = 'expense' AND transaction_date BETWEEN ? AND ?
      AND category IS NOT NULL
      GROUP BY category
      ORDER BY amount DESC`
    ).bind(startDate, endDate).all();
    
    const totalExpenses = (categoryResult.results || []).reduce((sum: number, r: any) => sum + r.amount, 0);
    const categoryBreakdown = (categoryResult.results || []).map((r: any) => ({
      category: r.category,
      amount: r.amount,
      percentage: totalExpenses > 0 ? (r.amount / totalExpenses) * 100 : 0
    }));
    
    // Payment methods
    const paymentMethodsResult = await c.env.DB.prepare(
      `SELECT 
        payment_method as method,
        SUM(amount) as total,
        COUNT(*) as count
      FROM cash_transactions
      WHERE type = 'income' AND transaction_date BETWEEN ? AND ?
      AND payment_method IS NOT NULL
      GROUP BY payment_method
      ORDER BY total DESC`
    ).bind(startDate, endDate).all();
    
    // Summary
    const summaryResult = await c.env.DB.prepare(
      `SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count
      FROM cash_transactions
      WHERE transaction_date BETWEEN ? AND ?`
    ).bind(startDate, endDate).first() as any;
    
    const totalIncome = summaryResult?.total_income || 0;
    const totalExpense = summaryResult?.total_expense || 0;
    const incomeCount = summaryResult?.income_count || 0;
    
    return c.json({
      monthly_revenue: monthlyRevenueResult.results || [],
      category_breakdown: categoryBreakdown,
      payment_methods: (paymentMethodsResult.results || []).map((r: any) => ({
        method: r.method,
        total: r.total,
        count: r.count
      })),
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        profit: totalIncome - totalExpense,
        avg_ticket: incomeCount > 0 ? totalIncome / incomeCount : 0,
        transactions_count: incomeCount
      }
    });
  } catch (error) {
    return c.json({ error: "Falha ao gerar relatório financeiro" }, 500);
  }
});

// GET analytics dashboard data
app.get("/api/analytics/dashboard", async (c) => {
  try {
    const startDate = c.req.query("start_date");
    
    // Get revenue by month
    let revenueQuery = `
      SELECT 
        strftime('%Y-%m', transaction_date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM cash_transactions
      WHERE 1=1
    `;
    
    const params: any[] = [];
    if (startDate) {
      revenueQuery += ' AND transaction_date >= ?';
      params.push(startDate);
    }
    
    revenueQuery += ' GROUP BY strftime("%Y-%m", transaction_date) ORDER BY month DESC LIMIT 12';
    
    const revenueResult = params.length > 0
      ? await c.env.DB.prepare(revenueQuery).bind(...params).all()
      : await c.env.DB.prepare(revenueQuery).all();
    
    // Get top services
    let servicesQuery = `
      SELECT 
        json_extract(value, '$.name') as service_name,
        COUNT(*) as count,
        SUM(CAST(json_extract(value, '$.price') as REAL)) as total_revenue
      FROM quotes, json_each(quotes.items)
      WHERE quotes.status = 'approved'
    `;
    
    if (startDate) {
      servicesQuery += ' AND quotes.created_at >= ?';
    }
    
    servicesQuery += ' GROUP BY service_name ORDER BY total_revenue DESC LIMIT 10';
    
    const servicesResult = startDate
      ? await c.env.DB.prepare(servicesQuery).bind(startDate).all()
      : await c.env.DB.prepare(servicesQuery).all();
    
    // Get top clients
    let clientsQuery = `
      SELECT 
        c.id,
        c.name,
        COUNT(q.id) as quote_count,
        SUM(q.total) as total_revenue
      FROM clients c
      JOIN quotes q ON c.id = q.client_id
      WHERE q.status = 'approved'
    `;
    
    if (startDate) {
      clientsQuery += ' AND q.created_at >= ?';
    }
    
    clientsQuery += ' GROUP BY c.id, c.name ORDER BY total_revenue DESC LIMIT 10';
    
    const clientsResult = startDate
      ? await c.env.DB.prepare(clientsQuery).bind(startDate).all()
      : await c.env.DB.prepare(clientsQuery).all();
    
    // Get stats
    const clientsCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM clients'
    ).first() as any;
    
    let quotesQuery = 'SELECT status, COUNT(*) as count FROM quotes';
    if (startDate) {
      quotesQuery += ' WHERE created_at >= ?';
    }
    quotesQuery += ' GROUP BY status';
    
    const quotesResult = startDate
      ? await c.env.DB.prepare(quotesQuery).bind(startDate).all()
      : await c.env.DB.prepare(quotesQuery).all();
    
    const approvedQuotes = (quotesResult.results || []).find((r: any) => r.status === 'approved');
    const pendingQuotes = (quotesResult.results || []).find((r: any) => r.status === 'pending');
    
    let appointmentsQuery = 'SELECT COUNT(*) as count FROM appointments WHERE status = "pending" AND appointment_date >= date("now")';
    if (startDate) {
      appointmentsQuery += ' AND appointment_date >= ?';
    }
    
    const appointmentsResult = startDate
      ? await c.env.DB.prepare(appointmentsQuery).bind(startDate).first() as any
      : await c.env.DB.prepare(appointmentsQuery).first() as any;
    
    let cashQuery = 'SELECT type, SUM(amount) as total FROM cash_transactions';
    if (startDate) {
      cashQuery += ' WHERE transaction_date >= ?';
    }
    cashQuery += ' GROUP BY type';
    
    const cashResult = startDate
      ? await c.env.DB.prepare(cashQuery).bind(startDate).all()
      : await c.env.DB.prepare(cashQuery).all();
    
    const income = (cashResult.results || []).find((r: any) => r.type === 'income');
    const expense = (cashResult.results || []).find((r: any) => r.type === 'expense');
    
    return c.json({
      revenue: revenueResult.results || [],
      topServices: servicesResult.results || [],
      topClients: clientsResult.results || [],
      stats: {
        total_clients: clientsCount?.count || 0,
        approved_quotes: (approvedQuotes as any)?.count || 0,
        pending_quotes: (pendingQuotes as any)?.count || 0,
        upcoming_appointments: appointmentsResult?.count || 0,
        total_income: (income as any)?.total || 0,
        total_expense: (expense as any)?.total || 0,
      }
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch analytics" }, 500);
  }
});

// GET all service prices
app.get("/api/service-prices", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM service_prices ORDER BY type ASC, name ASC"
    ).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Failed to fetch service prices" }, 500);
  }
});

// PUT update service price
app.put("/api/service-prices/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { price } = body;
    
    if (!price || price < 0) {
      return c.json({ error: "Preço inválido" }, 400);
    }

    const result = await c.env.DB.prepare(
      "UPDATE service_prices SET price = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(price, id).run();

    if (!result.success) {
      return c.json({ error: "Failed to update price" }, 500);
    }

    const updatedPrice = await c.env.DB.prepare(
      "SELECT * FROM service_prices WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedPrice);
  } catch (error) {
    return c.json({ error: "Failed to update price" }, 500);
  }
});

// SERVICES MANAGEMENT ENDPOINTS

// GET all services
app.get("/api/services", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT * FROM services ORDER BY type ASC, display_order ASC"
    ).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Failed to fetch services" }, 500);
  }
});

// POST create service
app.post("/api/services", async (c) => {
  try {
    const body = await c.req.json();
    const { service_id, name, type, price, description, is_hourly, is_per_track, is_per_image, is_per_video, combo_items } = body;
    
    if (!service_id || !name || !type || price === undefined) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (type !== 'service' && type !== 'combo') {
      return c.json({ error: "Type must be 'service' or 'combo'" }, 400);
    }

    // Get max display_order for this type
    const maxOrderResult = await c.env.DB.prepare(
      "SELECT MAX(display_order) as max_order FROM services WHERE type = ?"
    ).bind(type).first() as any;
    
    const nextOrder = (maxOrderResult?.max_order || 0) + 1;

    const result = await c.env.DB.prepare(
      "INSERT INTO services (service_id, name, type, price, description, is_hourly, is_per_track, is_per_image, is_per_video, combo_items, display_order, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))"
    ).bind(
      service_id,
      name,
      type,
      price,
      description || null,
      is_hourly ? 1 : 0,
      is_per_track ? 1 : 0,
      is_per_image ? 1 : 0,
      is_per_video ? 1 : 0,
      combo_items || null,
      nextOrder
    ).run();

    if (!result.success) {
      return c.json({ error: "Failed to create service" }, 500);
    }

    const newService = await c.env.DB.prepare(
      "SELECT * FROM services WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newService, 201);
  } catch (error) {
    return c.json({ error: "Failed to create service" }, 500);
  }
});

// PUT update service
app.put("/api/services/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, price, description, is_hourly, is_per_track, is_per_image, is_per_video, combo_items } = body;
    
    if (!name || price === undefined) {
      return c.json({ error: "Name and price are required" }, 400);
    }

    const result = await c.env.DB.prepare(
      "UPDATE services SET name = ?, price = ?, description = ?, is_hourly = ?, is_per_track = ?, is_per_image = ?, is_per_video = ?, combo_items = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(
      name,
      price,
      description || null,
      is_hourly ? 1 : 0,
      is_per_track ? 1 : 0,
      is_per_image ? 1 : 0,
      is_per_video ? 1 : 0,
      combo_items || null,
      id
    ).run();

    if (!result.success) {
      return c.json({ error: "Failed to update service" }, 500);
    }

    const updatedService = await c.env.DB.prepare(
      "SELECT * FROM services WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedService);
  } catch (error) {
    return c.json({ error: "Failed to update service" }, 500);
  }
});

// PUT toggle service active status
app.put("/api/services/:id/toggle", async (c) => {
  try {
    const id = c.req.param("id");
    
    const service = await c.env.DB.prepare(
      "SELECT is_active FROM services WHERE id = ?"
    ).bind(id).first() as any;

    if (!service) {
      return c.json({ error: "Service not found" }, 404);
    }

    const newStatus = service.is_active ? 0 : 1;

    const result = await c.env.DB.prepare(
      "UPDATE services SET is_active = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(newStatus, id).run();

    if (!result.success) {
      return c.json({ error: "Failed to toggle service status" }, 500);
    }

    const updatedService = await c.env.DB.prepare(
      "SELECT * FROM services WHERE id = ?"
    ).bind(id).first();

    return c.json(updatedService);
  } catch (error) {
    return c.json({ error: "Failed to toggle service status" }, 500);
  }
});

// DELETE service
app.delete("/api/services/:id", async (c) => {
  try {
    const id = c.req.param("id");
    
    const result = await c.env.DB.prepare(
      "DELETE FROM services WHERE id = ?"
    ).bind(id).run();

    if (!result.success) {
      return c.json({ error: "Failed to delete service" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete service" }, 500);
  }
});

// PUT reorder services
app.put("/api/services/reorder", async (c) => {
  try {
    const body = await c.req.json();
    const { services } = body;
    
    if (!services || !Array.isArray(services)) {
      return c.json({ error: "Services array is required" }, 400);
    }

    // Update each service's display_order
    for (const service of services) {
      await c.env.DB.prepare(
        "UPDATE services SET display_order = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(service.display_order, service.id).run();
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to reorder services" }, 500);
  }
});

// PROJECT FILES ENDPOINTS

// GET WhatsApp payment link for completed project
app.get("/api/project-files/:projectId/whatsapp-link", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    
    // Get project and payment link details
    const project = await c.env.DB.prepare(
      `SELECT ps.*, q.client_id, q.quote_number, q.total, c.whatsapp, c.name as client_name,
       (SELECT token FROM client_portal_links WHERE project_id = ps.id AND payment_required = 1 ORDER BY created_at DESC LIMIT 1) as payment_token
       FROM project_status ps 
       JOIN quotes q ON ps.quote_id = q.id 
       JOIN clients c ON q.client_id = c.id 
       WHERE ps.id = ?`
    ).bind(projectId).first() as any;

    if (!project || !project.payment_token) {
      return c.json({ error: "Link de pagamento não encontrado" }, 404);
    }

    // Generate payment link URL
    const origin = new URL(c.req.url).origin;
    const paymentUrl = `${origin}/portal/${project.payment_token}`;
    
    // Format WhatsApp message
    const message = encodeURIComponent(
      `Olá ${project.client_name}!\n\n` +
      `Seu projeto está concluído! 🎉\n\n` +
      `Orçamento: #${project.quote_number}\n` +
      `Valor: R$ ${project.total.toFixed(2)}\n\n` +
      `Acesse o link abaixo para visualizar os arquivos e realizar o pagamento:\n` +
      `${paymentUrl}\n\n` +
      `Após a confirmação do pagamento, você terá acesso completo para download dos arquivos.`
    );
    
    // WhatsApp Business API URL
    const whatsappUrl = `https://wa.me/${project.whatsapp.replace(/\D/g, '')}?text=${message}`;
    
    return c.json({
      whatsapp_url: whatsappUrl,
      payment_url: paymentUrl,
      project_status: project.status
    });
  } catch (error) {
    return c.json({ error: "Falha ao gerar link do WhatsApp" }, 500);
  }
});

// POST upload file for project
app.post("/api/project-files/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const notes = formData.get('notes') as string;
    
    if (!file) {
      return c.json({ error: "Arquivo não fornecido" }, 400);
    }

    // Validate file size (100 MB limit)
    const maxSizeBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSizeBytes) {
      return c.json({ error: "Arquivo muito grande! Limite máximo: 100 MB" }, 400);
    }

    // Generate unique key for R2
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const r2Key = `projects/${projectId}/${timestamp}_${sanitizedFilename}`;
    
    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2_BUCKET.put(r2Key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream',
      },
    });
    
    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const expiresAtISO = expiresAt.toISOString();
    
    // Save metadata to database
    const result = await c.env.DB.prepare(
      "INSERT INTO project_files (project_id, filename, original_filename, file_type, file_size, r2_key, upload_date, expires_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, date('now'), ?, ?, datetime('now'), datetime('now'))"
    ).bind(
      projectId,
      sanitizedFilename,
      file.name,
      file.type || 'application/octet-stream',
      file.size,
      r2Key,
      expiresAtISO,
      notes || null
    ).run();

    if (!result.success) {
      // Cleanup R2 if database insert fails
      await c.env.R2_BUCKET.delete(r2Key);
      return c.json({ error: "Falha ao salvar metadados do arquivo" }, 500);
    }

    const newFile = await c.env.DB.prepare(
      "SELECT * FROM project_files WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    // AUTOMATION: When files are uploaded, automatically mark project as completed
    // and create payment link
    try {
      // Get project details
      const project = await c.env.DB.prepare(
        "SELECT ps.*, q.client_id, c.whatsapp, c.name as client_name, q.quote_number, q.total FROM project_status ps JOIN quotes q ON ps.quote_id = q.id JOIN clients c ON q.client_id = c.id WHERE ps.id = ?"
      ).bind(projectId).first() as any;

      if (project && project.status !== 'completed') {
        // Update project status to completed
        await c.env.DB.prepare(
          "UPDATE project_status SET status = 'completed', progress = 100, actual_delivery = date('now'), notes = 'Projeto concluído automaticamente após upload de arquivos', updated_at = datetime('now') WHERE id = ?"
        ).bind(projectId).run();

        // Check if payment link already exists
        const existingLink = await c.env.DB.prepare(
          "SELECT id FROM client_portal_links WHERE project_id = ? AND payment_required = 1"
        ).bind(projectId).first();

        if (!existingLink) {
          // Generate payment link
          const token = crypto.randomUUID();
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiration

          const linkResult = await c.env.DB.prepare(
            "INSERT INTO client_portal_links (project_id, token, expires_at, payment_required, created_at, updated_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))"
          ).bind(projectId, token, expiresAt.toISOString()).run();

          if (linkResult.success && project.whatsapp) {
            // Generate payment link URL
            const paymentUrl = `${c.req.url.split('/api')[0]}/portal/${token}`;
            
            // Format WhatsApp message
            const message = encodeURIComponent(
              `Olá ${project.client_name}!\n\n` +
              `Seu projeto está concluído! 🎉\n\n` +
              `Orçamento: #${project.quote_number}\n` +
              `Valor: R$ ${project.total.toFixed(2)}\n\n` +
              `Acesse o link abaixo para visualizar os arquivos e realizar o pagamento:\n` +
              `${paymentUrl}\n\n` +
              `Após a confirmação do pagamento, você terá acesso completo para download dos arquivos.`
            );
            
            // WhatsApp Business API URL
            const whatsappUrl = `https://wa.me/${project.whatsapp.replace(/\D/g, '')}?text=${message}`;
            
            // Log the WhatsApp URL for auto-opening
          }
        }
      }
    } catch (automationError) {
      // Don't fail the file upload if automation fails
    }

    return c.json(newFile, 201);
  } catch (error) {
    return c.json({ error: "Falha ao fazer upload do arquivo" }, 500);
  }
});

// GET files for a project
app.get("/api/project-files/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    
    const result = await c.env.DB.prepare(
      "SELECT * FROM project_files WHERE project_id = ? ORDER BY upload_date DESC, created_at DESC"
    ).bind(projectId).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Falha ao buscar arquivos do projeto" }, 500);
  }
});

// GET download file
app.get("/api/files/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    
    // Get file metadata
    const fileMetadata = await c.env.DB.prepare(
      "SELECT * FROM project_files WHERE id = ?"
    ).bind(fileId).first() as any;
    
    if (!fileMetadata) {
      return c.json({ error: "Arquivo não encontrado" }, 404);
    }
    
    // Check if file has expired
    if (fileMetadata.expires_at) {
      const expiresAt = new Date(fileMetadata.expires_at);
      if (expiresAt < new Date()) {
        return c.json({ error: "Este arquivo expirou e não está mais disponível para download" }, 410);
      }
    }
    
    // Get file from R2
    const object = await c.env.R2_BUCKET.get(fileMetadata.r2_key);
    
    if (!object) {
      return c.json({ error: "Arquivo não encontrado no armazenamento" }, 404);
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Content-Disposition", `attachment; filename="${fileMetadata.original_filename}"`);
    
    return c.body(object.body, { headers });
  } catch (error) {
    return c.json({ error: "Falha ao baixar arquivo" }, 500);
  }
});

// DELETE file
app.delete("/api/project-files/:fileId", async (c) => {
  try {
    const fileId = c.req.param("fileId");
    
    // Get file metadata to get R2 key
    const fileMetadata = await c.env.DB.prepare(
      "SELECT r2_key FROM project_files WHERE id = ?"
    ).bind(fileId).first() as any;
    
    if (!fileMetadata) {
      return c.json({ error: "Arquivo não encontrado" }, 404);
    }
    
    // Delete from R2
    await c.env.R2_BUCKET.delete(fileMetadata.r2_key);
    
    // Delete from database
    const result = await c.env.DB.prepare(
      "DELETE FROM project_files WHERE id = ?"
    ).bind(fileId).run();

    if (!result.success) {
      return c.json({ error: "Falha ao excluir arquivo" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Falha ao excluir arquivo" }, 500);
  }
});

// CLIENT PORTAL ENDPOINTS

// POST create portal link
app.post("/api/portal-links/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const { expires_in_days, payment_required } = body;
    
    // Generate unique token
    const token = crypto.randomUUID();
    
    // Calculate expiration date if specified
    let expiresAt = null;
    if (expires_in_days && expires_in_days > 0) {
      const date = new Date();
      date.setDate(date.getDate() + expires_in_days);
      expiresAt = date.toISOString();
    }
    
    const result = await c.env.DB.prepare(
      "INSERT INTO client_portal_links (project_id, token, expires_at, payment_required, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).bind(projectId, token, expiresAt, payment_required ? 1 : 0).run();

    if (!result.success) {
      return c.json({ error: "Falha ao criar link do portal" }, 500);
    }

    const newLink = await c.env.DB.prepare(
      "SELECT * FROM client_portal_links WHERE id = ?"
    ).bind(result.meta.last_row_id).first();

    return c.json(newLink, 201);
  } catch (error) {
    return c.json({ error: "Falha ao criar link do portal" }, 500);
  }
});

// GET portal links for project
app.get("/api/portal-links/project/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    
    const result = await c.env.DB.prepare(
      "SELECT * FROM client_portal_links WHERE project_id = ? ORDER BY created_at DESC"
    ).bind(projectId).all();
    
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Falha ao buscar links do portal" }, 500);
  }
});

// GET portal data by token (for client access)

// ==================== PROSPECTS ====================

// GET all prospects
app.get("/api/prospects", async (c) => {
  try {
    const status = c.req.query("status");
    let query = "SELECT * FROM prospects";
    if (status) query += ` WHERE status = '${status}'`;
    query += " ORDER BY created_at DESC";
    const result = await c.env.DB.prepare(query).all();
    return c.json(result.results || []);
  } catch (error) {
    return c.json({ error: "Failed to fetch prospects" }, 500);
  }
});

// POST create prospect
app.post("/api/prospects", async (c) => {
  try {
    const body = await c.req.json();
    const { name, whatsapp, business_type, visit_date, status, chosen_package, next_followup, notes } = body;
    if (!name) return c.json({ error: "Nome obrigatório" }, 400);
    const result = await c.env.DB.prepare(
      "INSERT INTO prospects (name, whatsapp, business_type, visit_date, status, chosen_package, next_followup, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))"
    ).bind(name, whatsapp || null, business_type || null, visit_date || null, status || 'visitado', chosen_package || null, next_followup || null, notes || null).run();
    return c.json({ id: result.meta.last_row_id }, 201);
  } catch (error) {
    return c.json({ error: "Failed to create prospect" }, 500);
  }
});

// PUT update prospect
app.put("/api/prospects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { name, whatsapp, business_type, visit_date, status, chosen_package, next_followup, notes } = body;
    await c.env.DB.prepare(
      "UPDATE prospects SET name=?, whatsapp=?, business_type=?, visit_date=?, status=?, chosen_package=?, next_followup=?, notes=?, updated_at=datetime('now') WHERE id=?"
    ).bind(name, whatsapp || null, business_type || null, visit_date || null, status, chosen_package || null, next_followup || null, notes || null, id).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to update prospect" }, 500);
  }
});

// POST convert prospect to client
app.post("/api/prospects/:id/convert", async (c) => {
  try {
    const id = c.req.param("id");
    const prospect = await c.env.DB.prepare("SELECT * FROM prospects WHERE id = ?").bind(id).first() as any;
    if (!prospect) return c.json({ error: "Prospect not found" }, 404);

    // Create client
    const clientResult = await c.env.DB.prepare(
      "INSERT INTO clients (name, whatsapp, client_type, created_at, updated_at) VALUES (?, ?, 'fisica', datetime('now'), datetime('now'))"
    ).bind(prospect.name, prospect.whatsapp || '').run();

    const clientId = clientResult.meta.last_row_id;

    // Update prospect
    await c.env.DB.prepare(
      "UPDATE prospects SET status='fechado', converted_client_id=?, updated_at=datetime('now') WHERE id=?"
    ).bind(clientId, id).run();

    return c.json({ success: true, client_id: clientId });
  } catch (error) {
    return c.json({ error: "Failed to convert prospect" }, 500);
  }
});

// DELETE prospect
app.delete("/api/prospects/:id", async (c) => {
  try {
    await c.env.DB.prepare("DELETE FROM prospects WHERE id = ?").bind(c.req.param("id")).run();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete prospect" }, 500);
  }
});

app.get("/api/portal/:token", async (c) => {
  try {
    const token = c.req.param("token");
    
    // Get portal link
    const portalLink = await c.env.DB.prepare(
      "SELECT * FROM client_portal_links WHERE token = ?"
    ).bind(token).first() as any;
    
    if (!portalLink) {
      return c.json({ error: "Link inválido" }, 404);
    }
    
    // Check if active
    if (!portalLink.is_active) {
      return c.json({ error: "Link desativado" }, 403);
    }
    
    // Check expiration
    if (portalLink.expires_at) {
      const expiresAt = new Date(portalLink.expires_at);
      if (expiresAt < new Date()) {
        return c.json({ error: "Link expirado" }, 403);
      }
    }
    
    // Update access count and last accessed
    await c.env.DB.prepare(
      "UPDATE client_portal_links SET access_count = access_count + 1, last_accessed_at = datetime('now') WHERE id = ?"
    ).bind(portalLink.id).run();
    
    // Get project info
    const project = await c.env.DB.prepare(
      "SELECT ps.*, q.quote_number, c.name as client_name FROM project_status ps JOIN quotes q ON ps.quote_id = q.id JOIN clients c ON q.client_id = c.id WHERE ps.id = ?"
    ).bind(portalLink.project_id).first() as any;
    
    if (!project) {
      return c.json({ error: "Projeto não encontrado" }, 404);
    }
    
    // Get files
    const filesResult = await c.env.DB.prepare(
      "SELECT * FROM project_files WHERE project_id = ? ORDER BY upload_date DESC"
    ).bind(portalLink.project_id).all();
    
    return c.json({
      portal_link: portalLink,
      project,
      files: filesResult.results || []
    });
  } catch (error) {
    return c.json({ error: "Falha ao buscar dados do portal" }, 500);
  }
});

// GET file preview (15 seconds for audio)
app.get("/api/portal/:token/file/:fileId/preview", async (c) => {
  try {
    const token = c.req.param("token");
    const fileId = c.req.param("fileId");
    
    // Verify token
    const portalLink = await c.env.DB.prepare(
      "SELECT * FROM client_portal_links WHERE token = ?"
    ).bind(token).first() as any;
    
    if (!portalLink || !portalLink.is_active) {
      return c.json({ error: "Acesso negado" }, 403);
    }
    
    // Get file metadata
    const fileMetadata = await c.env.DB.prepare(
      "SELECT * FROM project_files WHERE id = ? AND project_id = ?"
    ).bind(fileId, portalLink.project_id).first() as any;
    
    if (!fileMetadata) {
      return c.json({ error: "Arquivo não encontrado" }, 404);
    }
    
    // Get file from R2
    const object = await c.env.R2_BUCKET.get(fileMetadata.r2_key);
    
    if (!object) {
      return c.json({ error: "Arquivo não encontrado no armazenamento" }, 404);
    }
    
    // For audio files, return first 15 seconds (approximately 240KB for MP3)
    // This is a simplified approach - proper audio trimming would require server-side processing
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    
    if (fileMetadata.file_type.startsWith('audio/')) {
      // Set range to approximately 15 seconds (240KB for typical MP3)
      const previewSize = Math.min(240 * 1024, fileMetadata.file_size);
      headers.set("Content-Range", `bytes 0-${previewSize - 1}/${fileMetadata.file_size}`);
      headers.set("Content-Length", previewSize.toString());
      
      // Get partial content
      const previewObject = await c.env.R2_BUCKET.get(fileMetadata.r2_key, {
        range: { offset: 0, length: previewSize }
      });
      
      if (previewObject) {
        return c.body(previewObject.body, { headers, status: 206 });
      }
    }
    
    // For non-audio files or if preview fails, return full file
    return c.body(object.body, { headers });
  } catch (error) {
    return c.json({ error: "Falha ao carregar preview" }, 500);
  }
});

// GET full file download (requires payment verification)
app.get("/api/portal/:token/file/:fileId/download", async (c) => {
  try {
    const token = c.req.param("token");
    const fileId = c.req.param("fileId");
    
    // Verify token
    const portalLink = await c.env.DB.prepare(
      "SELECT * FROM client_portal_links WHERE token = ?"
    ).bind(token).first() as any;
    
    if (!portalLink || !portalLink.is_active) {
      return c.json({ error: "Acesso negado" }, 403);
    }
    
    // Check payment requirement
    if (portalLink.payment_required && !portalLink.payment_verified) {
      return c.json({ error: "Pagamento necessário para download completo" }, 402);
    }
    
    // Get file metadata
    const fileMetadata = await c.env.DB.prepare(
      "SELECT * FROM project_files WHERE id = ? AND project_id = ?"
    ).bind(fileId, portalLink.project_id).first() as any;
    
    if (!fileMetadata) {
      return c.json({ error: "Arquivo não encontrado" }, 404);
    }
    
    // Get file from R2
    const object = await c.env.R2_BUCKET.get(fileMetadata.r2_key);
    
    if (!object) {
      return c.json({ error: "Arquivo não encontrado no armazenamento" }, 404);
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Content-Disposition", `attachment; filename="${fileMetadata.original_filename}"`);
    
    return c.body(object.body, { headers });
  } catch (error) {
    return c.json({ error: "Falha ao baixar arquivo" }, 500);
  }
});

// PUT verify payment
app.put("/api/portal-links/:linkId/verify-payment", async (c) => {
  try {
    const linkId = c.req.param("linkId");
    
    const result = await c.env.DB.prepare(
      "UPDATE client_portal_links SET payment_verified = 1, updated_at = datetime('now') WHERE id = ?"
    ).bind(linkId).run();

    if (!result.success) {
      return c.json({ error: "Falha ao verificar pagamento" }, 500);
    }

    const updatedLink = await c.env.DB.prepare(
      "SELECT * FROM client_portal_links WHERE id = ?"
    ).bind(linkId).first();

    return c.json(updatedLink);
  } catch (error) {
    return c.json({ error: "Falha ao verificar pagamento" }, 500);
  }
});

// PUT toggle portal link active status
app.put("/api/portal-links/:linkId/toggle", async (c) => {
  try {
    const linkId = c.req.param("linkId");
    
    const link = await c.env.DB.prepare(
      "SELECT is_active FROM client_portal_links WHERE id = ?"
    ).bind(linkId).first() as any;

    if (!link) {
      return c.json({ error: "Link não encontrado" }, 404);
    }

    const newStatus = link.is_active ? 0 : 1;

    const result = await c.env.DB.prepare(
      "UPDATE client_portal_links SET is_active = ?, updated_at = datetime('now') WHERE id = ?"
    ).bind(newStatus, linkId).run();

    if (!result.success) {
      return c.json({ error: "Falha ao alterar status do link" }, 500);
    }

    const updatedLink = await c.env.DB.prepare(
      "SELECT * FROM client_portal_links WHERE id = ?"
    ).bind(linkId).first();

    return c.json(updatedLink);
  } catch (error) {
    return c.json({ error: "Falha ao alterar status do link" }, 500);
  }
});

// DELETE portal link
app.delete("/api/portal-links/:linkId", async (c) => {
  try {
    const linkId = c.req.param("linkId");
    
    const result = await c.env.DB.prepare(
      "DELETE FROM client_portal_links WHERE id = ?"
    ).bind(linkId).run();

    if (!result.success) {
      return c.json({ error: "Falha ao excluir link" }, 500);
    }

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Falha ao excluir link" }, 500);
  }
});

// GET company data by CNPJ
app.get("/api/cnpj/:cnpj", async (c) => {
  try {
    const cnpj = c.req.param("cnpj").replace(/\D/g, '');
    
    if (cnpj.length !== 14) {
      return c.json({ error: "CNPJ inválido" }, 400);
    }

    // Try BrasilAPI first
    const brasilApiResponse = await fetch(`https://brasilapi.dev/api/cnpj/v1/${cnpj}`);
    
    if (brasilApiResponse.ok) {
      const data = await brasilApiResponse.json() as any;
      
      // Format address
      let fullAddress = '';
      if (data.logradouro) fullAddress += data.logradouro;
      if (data.numero) fullAddress += `, ${data.numero}`;
      if (data.complemento) fullAddress += `, ${data.complemento}`;
      if (data.bairro) fullAddress += ` - ${data.bairro}`;
      if (data.municipio) fullAddress += ` - ${data.municipio}`;
      if (data.uf) fullAddress += ` - ${data.uf}`;
      if (data.cep) fullAddress += ` - CEP: ${data.cep}`;
      
      return c.json({
        razao_social: data.razao_social || data.nome_fantasia || '',
        email: data.email || '',
        address: fullAddress.trim(),
        telefone: data.ddd_telefone_1 || '',
        cnpj: cnpj
      });
    }
    
    // If BrasilAPI fails, try ReceitaWS as fallback
    const receitaResponse = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cnpj}`);
    
    if (receitaResponse.ok) {
      const data = await receitaResponse.json() as any;
      
      if (data.status === 'ERROR') {
        return c.json({ error: data.message || 'CNPJ não encontrado' }, 404);
      }
      
      // Format address
      let fullAddress = '';
      if (data.logradouro) fullAddress += data.logradouro;
      if (data.numero) fullAddress += `, ${data.numero}`;
      if (data.complemento) fullAddress += `, ${data.complemento}`;
      if (data.bairro) fullAddress += ` - ${data.bairro}`;
      if (data.municipio) fullAddress += ` - ${data.municipio}`;
      if (data.uf) fullAddress += ` - ${data.uf}`;
      if (data.cep) fullAddress += ` - CEP: ${data.cep}`;
      
      return c.json({
        razao_social: data.nome || data.fantasia || '',
        email: data.email || '',
        address: fullAddress.trim(),
        telefone: data.telefone || '',
        cnpj: cnpj
      });
    }
    
    return c.json({ error: "CNPJ não encontrado" }, 404);
  } catch (error) {
    return c.json({ error: "Erro ao buscar dados do CNPJ" }, 500);
  }
});



// Scheduled event handler for cron jobs
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    
    // Run cleanup of archived quotes (older than 30 days)
    await cleanupArchivedQuotes(env);
  },
};
