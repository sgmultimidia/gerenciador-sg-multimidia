/**
 * Cron job to clean up expired project files
 * This should be run daily to remove files that have expired
 */

interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

export async function cleanupExpiredFiles(env: Env): Promise<void> {
  try {
    console.log('Starting expired files cleanup...');
    
    // Find all expired files
    const expiredFiles = await env.DB.prepare(
      "SELECT * FROM project_files WHERE expires_at IS NOT NULL AND expires_at < datetime('now')"
    ).all();
    
    if (!expiredFiles.results || expiredFiles.results.length === 0) {
      console.log('No expired files found');
      return;
    }
    
    console.log(`Found ${expiredFiles.results.length} expired files`);
    
    let deletedCount = 0;
    let errorCount = 0;
    
    // Delete each expired file from R2 and database
    for (const file of expiredFiles.results as any[]) {
      try {
        // Delete from R2
        await env.R2_BUCKET.delete(file.r2_key);
        
        // Delete from database
        await env.DB.prepare(
          "DELETE FROM project_files WHERE id = ?"
        ).bind(file.id).run();
        
        deletedCount++;
        console.log(`Deleted expired file: ${file.original_filename} (ID: ${file.id})`);
      } catch (error) {
        errorCount++;
        console.error(`Error deleting file ${file.id}:`, error);
      }
    }
    
    console.log(`Cleanup complete: ${deletedCount} files deleted, ${errorCount} errors`);
  } catch (error) {
    console.error('Error in cleanup job:', error);
    throw error;
  }
}

// Cloudflare Worker cron handler
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(cleanupExpiredFiles(env));
  },
};
