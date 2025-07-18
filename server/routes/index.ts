import { Router } from 'express'
import type { Services } from '../services'
import reminderRoutes from './reminders'
import dataQualityRoutes from './dataQuality'

export default function routes(services: Services): Router {
  const router = Router()
  reminderRoutes(router, services)
  dataQualityRoutes(router, services)
  return router
}
