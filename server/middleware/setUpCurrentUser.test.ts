import express from 'express'
import jwt from 'jsonwebtoken'
import request from 'supertest'
import setUpCurrentUser from './setUpCurrentUser'

describe('setUpCurrentUser', () => {
  it('populates userUuid from the user_uuid JWT claim', async () => {
    const userUuid = 'd77ed386-5b0b-4869-82a0-9cbe4719ac10'
    const token = jwt.sign(
      {
        name: 'Test User',
        user_id: '1234',
        authorities: [],
        user_uuid: userUuid,
      },
      'secret',
    )
    const app = express()

    app.use((req, res, next) => {
      res.locals.user = {
        token,
        username: 'user1',
        authSource: 'delius',
        userId: 'initial-id',
        name: 'Initial User',
        displayName: 'Initial User',
        userRoles: [],
        userUuid: 'initial-uuid',
      }
      next()
    })
    app.use(setUpCurrentUser())
    app.get('/', (req, res) => res.json({ userUuid: res.locals.user.userUuid }))

    const response = await request(app).get('/')

    expect(response.body.userUuid).toBe(userUuid)
  })
})
