const router = require('express').Router()
const repo   = require('../repositories/employeeRepo')
const { requireAuth, requireRole } = require('../middleware/auth')
const { auditRead } = require('../middleware/auditLog')

router.get('/', requireAuth, auditRead('Empleados'), async (req, res, next) => {
  try { res.json({ data: await repo.findAll() }) }
  catch (err) { next(err) }
})

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const emp = await repo.findById(req.params.id)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json({ data: emp })
  } catch (err) { next(err) }
})

router.post('/', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { name, document, position, area, groupName, shift, startDate, baseSalary } = req.body
    if (!name || !document || !position) {
      return res.status(400).json({ error: 'name, document y position son requeridos' })
    }
    const emp = await repo.create({
      name, document, position, area, groupName, shift, startDate, baseSalary,
      createdBy: req.user.id
    })
    res.status(201).json({ data: emp })
  } catch (err) { next(err) }
})

router.put('/:id', requireAuth, requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const emp = await repo.update(req.params.id, req.body)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json({ data: emp })
  } catch (err) { next(err) }
})

router.patch('/:id/status', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'status debe ser active o inactive' })
    }
    const emp = await repo.setStatus(req.params.id, status)
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' })
    res.json({ data: emp })
  } catch (err) { next(err) }
})

module.exports = router
