import jwt from 'jsonwebtoken'

export default function createUserToken(authorities: string[]) {
  const payload = {
    user_name: 'user1',
    scope: ['read', 'write'],
    auth_source: 'nomis',
    authorities,
    jti: 'a610a10-cca6-41db-985f-e87efb303aaf',
    client_id: 'clientid',
    user_uuid: 'd77ed386-5b0b-4869-82a0-9cbe4719ac10',
  }

  return jwt.sign(payload, 'secret', { expiresIn: '1h' })
}
