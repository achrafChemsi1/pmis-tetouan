/**
 * Database Migrations
 * Database schema migration scripts
 * @module database/migrations
 */

const db = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

/**
 * Create migrations table if not exists
 */
const createMigrationsTable = async (connection) => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      migration_id INT AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_migration_name (migration_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await connection.query(query);
};

/**
 * Check if migration has been executed
 */
const isMigrationExecuted = async (connection, migrationName) => {
  const [rows] = await connection.query(
    'SELECT migration_id FROM migrations WHERE migration_name = ?',
    [migrationName]
  );
  
  return rows.length > 0;
};

/**
 * Record migration execution
 */
const recordMigration = async (connection, migrationName) => {
  await connection.query(
    'INSERT INTO migrations (migration_name) VALUES (?)',
    [migrationName]
  );
};

/**
 * Migration: Add email verification columns
 */
const addEmailVerification = async (connection) => {
  const migrationName = 'add_email_verification';
  
  if (await isMigrationExecuted(connection, migrationName)) {
    console.log(`✓ Migration '${migrationName}' already executed`);
    return;
  }
  
  console.log(`Running migration: ${migrationName}`);
  
  const query = `
    ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER email,
    ADD COLUMN email_verification_token VARCHAR(255) AFTER email_verified,
    ADD COLUMN email_verification_expires DATETIME AFTER email_verification_token;
  `;
  
  try {
    await connection.query(query);
    await recordMigration(connection, migrationName);
    console.log(`✓ Migration '${migrationName}' executed successfully`);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log(`✓ Migration '${migrationName}' columns already exist`);
      await recordMigration(connection, migrationName);
    } else {
      throw error;
    }
  }
};

/**
 * Migration: Add project milestones table
 */
const addProjectMilestones = async (connection) => {
  const migrationName = 'add_project_milestones';
  
  if (await isMigrationExecuted(connection, migrationName)) {
    console.log(`✓ Migration '${migrationName}' already executed`);
    return;
  }
  
  console.log(`Running migration: ${migrationName}`);
  
  const query = `
    CREATE TABLE IF NOT EXISTS project_milestones (
      milestone_id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      milestone_name VARCHAR(200) NOT NULL,
      description TEXT,
      target_date DATE NOT NULL,
      completion_date DATE,
      status ENUM('pending', 'in_progress', 'completed', 'delayed') DEFAULT 'pending',
      completion_percentage DECIMAL(5,2) DEFAULT 0.00,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
      INDEX idx_project_milestones (project_id),
      INDEX idx_milestone_status (status),
      INDEX idx_target_date (target_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await connection.query(query);
  await recordMigration(connection, migrationName);
  console.log(`✓ Migration '${migrationName}' executed successfully`);
};

/**
 * Migration: Add audit log table
 */
const addAuditLog = async (connection) => {
  const migrationName = 'add_audit_log';
  
  if (await isMigrationExecuted(connection, migrationName)) {
    console.log(`✓ Migration '${migrationName}' already executed`);
    return;
  }
  
  console.log(`Running migration: ${migrationName}`);
  
  const query = `
    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT,
      old_values JSON,
      new_values JSON,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
      INDEX idx_user_logs (user_id),
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_action (action),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await connection.query(query);
  await recordMigration(connection, migrationName);
  console.log(`✓ Migration '${migrationName}' executed successfully`);
};

/**
 * Migration: Add file attachments table
 */
const addFileAttachments = async (connection) => {
  const migrationName = 'add_file_attachments';
  
  if (await isMigrationExecuted(connection, migrationName)) {
    console.log(`✓ Migration '${migrationName}' already executed`);
    return;
  }
  
  console.log(`Running migration: ${migrationName}`);
  
  const query = `
    CREATE TABLE IF NOT EXISTS file_attachments (
      file_id INT AUTO_INCREMENT PRIMARY KEY,
      entity_type VARCHAR(50) NOT NULL,
      entity_id INT NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size BIGINT NOT NULL,
      file_type VARCHAR(100),
      mime_type VARCHAR(100),
      uploaded_by INT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE SET NULL,
      INDEX idx_entity (entity_type, entity_id),
      INDEX idx_uploaded_by (uploaded_by)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await connection.query(query);
  await recordMigration(connection, migrationName);
  console.log(`✓ Migration '${migrationName}' executed successfully`);
};

/**
 * Migration: Add notification system
 */
const addNotifications = async (connection) => {
  const migrationName = 'add_notifications';
  
  if (await isMigrationExecuted(connection, migrationName)) {
    console.log(`✓ Migration '${migrationName}' already executed`);
    return;
  }
  
  console.log(`Running migration: ${migrationName}`);
  
  const query = `
    CREATE TABLE IF NOT EXISTS notifications (
      notification_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      entity_type VARCHAR(50),
      entity_id INT,
      is_read BOOLEAN DEFAULT FALSE,
      read_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      INDEX idx_user_notifications (user_id, is_read),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await connection.query(query);
  await recordMigration(connection, migrationName);
  console.log(`✓ Migration '${migrationName}' executed successfully`);
};

/**
 * Migration: Add indexes for performance optimization
 */
const addPerformanceIndexes = async (connection) => {
  const migrationName = 'add_performance_indexes';
  
  if (await isMigrationExecuted(connection, migrationName)) {
    console.log(`✓ Migration '${migrationName}' already executed`);
    return;
  }
  
  console.log(`Running migration: ${migrationName}`);
  
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_projects_status_dates ON projects(status, start_date, end_date)',
    'CREATE INDEX IF NOT EXISTS idx_budgets_fiscal_year ON budgets(fiscal_year, status)',
    'CREATE INDEX IF NOT EXISTS idx_equipment_status_location ON equipment(status, location)',
    'CREATE INDEX IF NOT EXISTS idx_transactions_date ON budget_transactions(transaction_date, status)',
    'CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status, created_at)'
  ];
  
  for (const indexQuery of indexes) {
    try {
      await connection.query(indexQuery);
    } catch (error) {
      if (error.code !== 'ER_DUP_KEYNAME') {
        throw error;
      }
    }
  }
  
  await recordMigration(connection, migrationName);
  console.log(`✓ Migration '${migrationName}' executed successfully`);
};

/**
 * Run all pending migrations
 */
const runMigrations = async () => {
  let connection;
  
  try {
    console.log('\n=== Starting Database Migrations ===\n');
    
    connection = await db.getConnection();
    
    // Create migrations table
    await createMigrationsTable(connection);
    
    // Run migrations in order
    await addEmailVerification(connection);
    await addProjectMilestones(connection);
    await addAuditLog(connection);
    await addFileAttachments(connection);
    await addNotifications(connection);
    await addPerformanceIndexes(connection);
    
    console.log('\n=== Database Migrations Completed Successfully ===\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
};

/**
 * Rollback last migration (for development only)
 */
const rollbackMigration = async (migrationName) => {
  let connection;
  
  try {
    console.log(`\n=== Rolling back migration: ${migrationName} ===\n`);
    
    connection = await db.getConnection();
    
    await connection.query(
      'DELETE FROM migrations WHERE migration_name = ?',
      [migrationName]
    );
    
    console.log(`✓ Migration '${migrationName}' rolled back`);
    console.log('\nNote: You may need to manually drop tables/columns created by this migration\n');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
};

// Run migrations if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'rollback' && args[1]) {
    rollbackMigration(args[1]);
  } else {
    runMigrations();
  }
}

module.exports = {
  runMigrations,
  rollbackMigration
};
