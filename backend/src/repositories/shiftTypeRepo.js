const { query } = require('../db/client')

const shiftTypeRepo = {
  async findAll() {
    const { rows } = await query(
      'SELECT * FROM shift_types ORDER BY code'
    )
    return rows
  },

  async findById(id) {
    const { rows } = await query('SELECT * FROM shift_types WHERE id=$1', [id])
    return rows[0]
  },

  async create(d) {
    const { rows } = await query(
      `INSERT INTO shift_types
        (name, code, start_time, end_time, total_hours, ordinary_hours, extra_hours,
         night_hours, surcharge_hours, sunday_holiday_hours,
         extra_multiplier, night_multiplier, surcharge_multiplier, sunday_holiday_multiplier,
         color, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        d.name, d.code, d.startTime || null, d.endTime || null,
        d.totalHours || 0, d.ordinaryHours || 0, d.extraHours || 0,
        d.nightHours || 0, d.surchargeHours || 0, d.sundayHolidayHours || 0,
        d.extraMultiplier ?? 1.25, d.nightMultiplier ?? 1.35,
        d.surchargeMultiplier ?? 1.35, d.sundayHolidayMultiplier ?? 1.75,
        d.color || '#3B82F6', d.createdBy
      ]
    )
    return rows[0]
  },

  async update(id, d) {
    const { rows } = await query(
      `UPDATE shift_types SET
        name=$1, code=$2, start_time=$3, end_time=$4, total_hours=$5,
        ordinary_hours=$6, extra_hours=$7, night_hours=$8, surcharge_hours=$9,
        sunday_holiday_hours=$10, extra_multiplier=$11, night_multiplier=$12,
        surcharge_multiplier=$13, sunday_holiday_multiplier=$14, color=$15, active=$16
       WHERE id=$17 RETURNING *`,
      [
        d.name, d.code, d.startTime || null, d.endTime || null,
        d.totalHours || 0, d.ordinaryHours || 0, d.extraHours || 0,
        d.nightHours || 0, d.surchargeHours || 0, d.sundayHolidayHours || 0,
        d.extraMultiplier ?? 1.25, d.nightMultiplier ?? 1.35,
        d.surchargeMultiplier ?? 1.35, d.sundayHolidayMultiplier ?? 1.75,
        d.color || '#3B82F6', d.active ?? true, id
      ]
    )
    return rows[0]
  },

  async remove(id) {
    await query('DELETE FROM shift_types WHERE id=$1', [id])
  }
}

module.exports = shiftTypeRepo
