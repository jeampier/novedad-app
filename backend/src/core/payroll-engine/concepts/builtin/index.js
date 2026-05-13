const { ConceptRegistry } = require('../ConceptRegistry')

const registry = new ConceptRegistry()

registry
  .register(require('./ordinaryHours'))
  .register(require('./extraHours'))
  .register(require('./nightHours'))
  .register(require('./surchargeHours'))
  .register(require('./sundayHolidayHours'))

module.exports = { registry }
