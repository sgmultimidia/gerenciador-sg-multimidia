/**
 * Cron job to clean up archived quotes older than 30 days
 * 
 * This job should be scheduled to run daily via Cloudflare Cron Triggers
 * 
 * To configure in wrangler.json, add:
 * {
 *   "triggers": {
 *     "crons": ["0 2 * * *"]
 *   }
 * }
 * 
 * This will run the job at 2 AM UTC every day
 */

export async function cleanupArchivedQuotes(env: Env): Promise<void> {
  try {
    console.log('[Cron] Starting cleanup of archived quotes older than 30 days...');
    
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();
    
    // Delete archived quotes older than 30 days
    const result = await env.DB.prepare(
      "DELETE FROM quotes WHERE archived_at IS NOT NULL AND archived_at < ?"
    ).bind(cutoffDate).run();
    
    const deletedCount = result.meta?.changes || 0;
    
    console.log(`[Cron] Cleanup completed. Deleted ${deletedCount} archived quotes older than 30 days.`);
    
    // Also cleanup any orphaned related data
    // Delete receipts for deleted quotes
    await env.DB.prepare(
      "DELETE FROM receipts WHERE quote_id NOT IN (SELECT id FROM quotes)"
    ).run();
    
    // Delete payments for deleted quotes
    await env.DB.prepare(
      "DELETE FROM payments WHERE quote_id NOT IN (SELECT id FROM quotes)"
    ).run();
    
    // Delete project status for deleted quotes
    await env.DB.prepare(
      "DELETE FROM project_status WHERE quote_id NOT IN (SELECT id FROM quotes)"
    ).run();
    
    console.log('[Cron] Orphaned data cleanup completed.');
    
  } catch (error) {
    console.error('[Cron] Error during archived quotes cleanup:', error);
    throw error;
  }
}
