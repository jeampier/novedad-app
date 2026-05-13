const { query } = require('../db/client')

const employeeRepo = {
  async create(d) {
    const { rows } = await query(
      `INSERT INTO employees
         (name, document, position, area, group_name, start_date, shift, base_salary, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [d.name, d.document, d.position, d.area || null, d.groupName || null,
       d.startDate || null, d.shift || null, d.baseSalary || 0, d.createdBy]
    )
    return rows[0]
  },

  async update(id, d) {
    const { rows } = await query(
      `UPDATE employees SET
         name=$1, document=$2, position=$3, area=$4, group_name=$5,
         shift=$6, base_salary=$7
       WHERE id=$8 RETURNING *`,
      [d.name, d.document, d.position, d.area || null, d.groupName || null,
       d.shift || null, d.baseSalary ?? 0, id]
    )
    return rows[0]
  },

  async deactivate(d) {
    const { rows } = await query(
      `UPDATE employees SET status='inactive', end_date=$2 WHERE id=$1 RETURNING *`,
      [d.employeeId, d.endDate]
    )
    return rows[0]
  },

  async setStatus(id, status) {
    const { rows } = await query(
      `UPDATE employees SET status=$2 WHERE id=$1 RETURNING *`,
      [id, status]
    )
    return rows[0]
  },

  async findAll() {
    const { rows } = await query(
      `SELECT * FROM employees WHERE status='active' ORDER BY name`
    )
    return rows
  },

  async findById(id) {
    const { rows } = await query(
      'SELECT * FROM employees WHERE id=$1', [id]
    )
    return rows[0]
  }
}

module.exports = employeeRepo
