import { jwtDecode } from 'jwt-decode'
import type { RequestHandler } from 'express'

import logger from '../../logger'

export default function authorisationMiddleware(requiredRoles: string[] = []): RequestHandler {
  return (req, res, next) => {
    if (res.locals?.user?.token) {
      const { authorities: roles = [] } = jwtDecode(res.locals.user.token) as { authorities?: string[] }

      if (
        res.locals?.user?.authSource !== 'delius' &&
        requiredRoles.length &&
        !roles.some(role => requiredRoles.includes(role))
      ) {
        logger.error('User is not authorised to access this')
        return res.redirect('/authError')
      }

      return next()
    }

    req.session.returnTo = req.originalUrl
    return res.redirect('/sign-in')
  }
}
