/**
 * Database Seeders
 * Seed data for initial database population
 * @module database/seeders
 */

const db = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Seed system roles
 */
const seedRoles = async (connection) => {
  console.log('Seeding roles...');
  
  const roles = [
    { role_name: 'admin', description: 'System Administrator with full access', permissions: JSON.stringify(['all']) },
    { role_name: 'director', description: 'Prefecture Director', permissions: JSON.stringify(['view_all', 'approve_budgets', 'approve_projects']) },
    { role_name: 'project_manager', description: 'Project Manager', permissions: JSON.stringify(['manage_projects', 'view_budgets', 'request_equipment']) },
    { role_name: 'finance_manager', description: 'Finance Manager', permissions: JSON.stringify(['manage_budgets', 'view_projects', 'approve_transactions']) },
    { role_name: 'equipment_manager', description: 'Equipment Manager', permissions: JSON.stringify(['manage_equipment', 'view_projects', 'allocate_equipment']) },
    { role_name: 'hr_manager', description: 'HR Manager', permissions: JSON.stringify(['manage_users', 'view_projects']) },
    { role_name: 'staff', description: 'General Staff', permissions: JSON.stringify(['view_projects', 'view_equipment']) }
  ];
  
  for (const role of roles) {
    await connection.query(
      'INSERT IGNORE INTO roles (role_name, description, permissions) VALUES (?, ?, ?)',
      [role.role_name, role.description, role.permissions]
    );
  }
  
  console.log('✓ Roles seeded successfully');
};

/**
 * Seed default admin user
 */
const seedUsers = async (connection) => {
  console.log('Seeding users...');
  
  const hashedPassword = await bcrypt.hash('Admin@2025', 10);
  
  const users = [
    {
      email: 'admin@pmis-tetouan.ma',
      password_hash: hashedPassword,
      full_name: 'System Administrator',
      role: 'admin',
      department: 'IT',
      phone: '+212-5-39-99-99-99',
      status: 'active'
    },
    {
      email: 'director@pmis-tetouan.ma',
      password_hash: await bcrypt.hash('Director@2025', 10),
      full_name: 'Mohamed Alaoui',
      role: 'director',
      department: 'Administration',
      phone: '+212-5-39-99-99-01',
      status: 'active'
    },
    {
      email: 'finance@pmis-tetouan.ma',
      password_hash: await bcrypt.hash('Finance@2025', 10),
      full_name: 'Fatima Bennis',
      role: 'finance_manager',
      department: 'Finance',
      phone: '+212-5-39-99-99-02',
      status: 'active'
    },
    {
      email: 'equipment@pmis-tetouan.ma',
      password_hash: await bcrypt.hash('Equipment@2025', 10),
      full_name: 'Hassan Tazi',
      role: 'equipment_manager',
      department: 'Equipment',
      phone: '+212-5-39-99-99-03',
      status: 'active'
    }
  ];
  
  for (const user of users) {
    await connection.query(
      `INSERT IGNORE INTO users (email, password_hash, full_name, role, department, phone, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.email, user.password_hash, user.full_name, user.role, user.department, user.phone, user.status]
    );
  }
  
  console.log('✓ Users seeded successfully');
  console.log('  Default admin: admin@pmis-tetouan.ma / Admin@2025');
};

/**
 * Seed equipment types and categories
 */
const seedEquipmentTypes = async (connection) => {
  console.log('Seeding equipment types and categories...');
  
  const categories = [
    { category_name: 'Construction Equipment', description: 'Heavy construction machinery' },
    { category_name: 'IT Equipment', description: 'Computers and IT infrastructure' },
    { category_name: 'Office Equipment', description: 'Office furniture and supplies' },
    { category_name: 'Vehicles', description: 'Transportation vehicles' },
    { category_name: 'Tools', description: 'Hand and power tools' }
  ];
  
  for (const category of categories) {
    await connection.query(
      'INSERT IGNORE INTO equipment_categories (category_name, description) VALUES (?, ?)',
      [category.category_name, category.description]
    );
  }
  
  const types = [
    { type_name: 'Excavator', description: 'Heavy digging equipment', category_id: 1 },
    { type_name: 'Bulldozer', description: 'Earth moving equipment', category_id: 1 },
    { type_name: 'Desktop Computer', description: 'Desktop PC', category_id: 2 },
    { type_name: 'Laptop', description: 'Portable computer', category_id: 2 },
    { type_name: 'Printer', description: 'Document printer', category_id: 2 },
    { type_name: 'Desk', description: 'Office desk', category_id: 3 },
    { type_name: 'Chair', description: 'Office chair', category_id: 3 },
    { type_name: 'Truck', description: 'Cargo truck', category_id: 4 },
    { type_name: 'Van', description: 'Passenger van', category_id: 4 }
  ];
  
  for (const type of types) {
    await connection.query(
      'INSERT IGNORE INTO equipment_types (type_name, description, category_id) VALUES (?, ?, ?)',
      [type.type_name, type.description, type.category_id]
    );
  }
  
  console.log('✓ Equipment types and categories seeded successfully');
};

/**
 * Seed budget categories
 */
const seedBudgetCategories = async (connection) => {
  console.log('Seeding budget categories...');
  
  const categories = [
    { category_name: 'Personnel', description: 'Staff salaries and benefits', budget_code: 'BUD-PERS' },
    { category_name: 'Equipment', description: 'Equipment purchase and maintenance', budget_code: 'BUD-EQUIP' },
    { category_name: 'Operations', description: 'Operational expenses', budget_code: 'BUD-OPS' },
    { category_name: 'Infrastructure', description: 'Infrastructure projects', budget_code: 'BUD-INFRA' },
    { category_name: 'Services', description: 'Professional services', budget_code: 'BUD-SERV' },
    { category_name: 'Maintenance', description: 'Maintenance and repairs', budget_code: 'BUD-MAINT' },
    { category_name: 'Supplies', description: 'Office and project supplies', budget_code: 'BUD-SUPP' }
  ];
  
  for (const category of categories) {
    await connection.query(
      'INSERT IGNORE INTO budget_categories (category_name, description, budget_code) VALUES (?, ?, ?)',
      [category.category_name, category.description, category.budget_code]
    );
  }
  
  console.log('✓ Budget categories seeded successfully');
};

/**
 * Seed approval workflows
 */
const seedApprovalWorkflows = async (connection) => {
  console.log('Seeding approval workflows...');
  
  const workflows = [
    {
      workflow_name: 'Project Approval',
      entity_type: 'project',
      description: 'Multi-level approval for new projects',
      is_active: 1
    },
    {
      workflow_name: 'Budget Approval',
      entity_type: 'budget',
      description: 'Budget allocation approval workflow',
      is_active: 1
    },
    {
      workflow_name: 'Equipment Purchase',
      entity_type: 'equipment',
      description: 'Equipment purchase approval',
      is_active: 1
    },
    {
      workflow_name: 'Large Transaction',
      entity_type: 'transaction',
      description: 'Approval for transactions over threshold',
      is_active: 1
    }
  ];
  
  for (const workflow of workflows) {
    const [result] = await connection.query(
      `INSERT IGNORE INTO approval_workflows (workflow_name, entity_type, description, is_active) 
       VALUES (?, ?, ?, ?)`,
      [workflow.workflow_name, workflow.entity_type, workflow.description, workflow.is_active]
    );
    
    if (result.insertId > 0) {
      // Add workflow levels
      const levels = [
        { level_name: 'Department Manager', level_order: 1, required_role: 'project_manager' },
        { level_name: 'Finance Review', level_order: 2, required_role: 'finance_manager' },
        { level_name: 'Director Approval', level_order: 3, required_role: 'director' }
      ];
      
      for (const level of levels) {
        await connection.query(
          `INSERT INTO approval_workflow_levels (workflow_id, level_name, level_order, required_role) 
           VALUES (?, ?, ?, ?)`,
          [result.insertId, level.level_name, level.level_order, level.required_role]
        );
      }
    }
  }
  
  console.log('✓ Approval workflows seeded successfully');
};

/**
 * Seed sample vendors
 */
const seedVendors = async (connection) => {
  console.log('Seeding sample vendors...');
  
  const vendors = [
    {
      vendor_name: 'Construction Supplies Maroc',
      category: 'construction',
      contact_person: 'Ahmed Benani',
      email: 'contact@csm.ma',
      phone: '+212-5-37-11-11-11',
      address: '123 Avenue Hassan II',
      city: 'Tétouan',
      country: 'Morocco',
      tax_id: 'TAX-CSM-001',
      payment_terms: 'net_30',
      rating: 4.5,
      status: 'active'
    },
    {
      vendor_name: 'TechnoMaroc IT Solutions',
      category: 'it_equipment',
      contact_person: 'Karim El Fassi',
      email: 'sales@technomaroc.ma',
      phone: '+212-5-37-22-22-22',
      address: '456 Boulevard Mohammed V',
      city: 'Rabat',
      country: 'Morocco',
      tax_id: 'TAX-TMS-002',
      payment_terms: 'net_15',
      rating: 4.8,
      status: 'active'
    },
    {
      vendor_name: 'Office Pro Maroc',
      category: 'office_supplies',
      contact_person: 'Salma Idrissi',
      email: 'info@officepro.ma',
      phone: '+212-5-37-33-33-33',
      address: '789 Rue Al Maghreb Al Arabi',
      city: 'Tétouan',
      country: 'Morocco',
      tax_id: 'TAX-OPM-003',
      payment_terms: 'net_30',
      rating: 4.2,
      status: 'active'
    }
  ];
  
  for (const vendor of vendors) {
    await connection.query(
      `INSERT IGNORE INTO vendors (
        vendor_name, category, contact_person, email, phone,
        address, city, country, tax_id, payment_terms, rating, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        vendor.vendor_name, vendor.category, vendor.contact_person, vendor.email, vendor.phone,
        vendor.address, vendor.city, vendor.country, vendor.tax_id, vendor.payment_terms,
        vendor.rating, vendor.status
      ]
    );
  }
  
  console.log('✓ Sample vendors seeded successfully');
};

/**
 * Main seeder function
 */
const runSeeders = async () => {
  let connection;
  
  try {
    console.log('\n=== Starting Database Seeding ===\n');
    
    connection = await db.getConnection();
    await connection.beginTransaction();
    
    await seedRoles(connection);
    await seedUsers(connection);
    await seedEquipmentTypes(connection);
    await seedBudgetCategories(connection);
    await seedApprovalWorkflows(connection);
    await seedVendors(connection);
    
    await connection.commit();
    
    console.log('\n=== Database Seeding Completed Successfully ===\n');
    console.log('You can now login with:');
    console.log('  Email: admin@pmis-tetouan.ma');
    console.log('  Password: Admin@2025\n');
    
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Seeding failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
};

// Run seeders if called directly
if (require.main === module) {
  runSeeders();
}

module.exports = {
  runSeeders,
  seedRoles,
  seedUsers,
  seedEquipmentTypes,
  seedBudgetCategories,
  seedApprovalWorkflows,
  seedVendors
};
