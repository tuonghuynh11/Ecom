const axios = require('axios')

const ENDPOINT = 'http://localhost:3000/orders'

const accessTokenUser1 = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImRldmljZUlkIjoyMDksInJvbGVJZCI6Miwicm9sZU5hbWUiOiJDTElFTlQiLCJ1dWlkIjoiNmMyMzVmNDktODBiNy00ZjY4LWEyMGYtMjczZjIzNjM3ODcwIiwiaWF0IjoxNzQ5NzIzMjExLCJleHAiOjE3NDk3MjY4MTF9.djCqCEUI6geJyy8ajsoddpOyPGMx8Fa5x4oI593_s8s`
const accessTokenUser2 = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI4LCJkZXZpY2VJZCI6MjEwLCJyb2xlSWQiOjMsInJvbGVOYW1lIjoiU0VMTEVSIiwidXVpZCI6ImI3ZDAzYTIxLTUwNWUtNDRkMS1iYWFiLTM2MTZiOGY1ZDg4MSIsImlhdCI6MTc0OTcyMzIzOSwiZXhwIjoxNzQ5NzI2ODM5fQ.yvz_2uiNrA0odSvozkEr2mSF0zGCMQDQUPDyfcgj1B0`

const baseHeaders = {
  'Content-Type': 'application/json',
}

const headers1 = {
  ...baseHeaders,
  Authorization: `Bearer ${accessTokenUser1}`,
}

const headers2 = {
  ...baseHeaders,
  Authorization: `Bearer ${accessTokenUser2}`,
}

const orderBody1 = [
  {
    shopId: 29,
    cartItemIds: [75],
    receiver: {
      name: 'Được',
      phone: '0905123456',
      address: 'Đà Nẵng, Việt Nam',
    },
  },
]

const orderBody2 = [
  {
    shopId: 29,
    cartItemIds: [73],
    receiver: {
      name: 'Được',
      phone: '0905123456',
      address: 'Đà Nẵng, Việt Nam',
    },
  },
]

// const order1$ =

// const order2$ =

Promise.all([
  axios
    .post(ENDPOINT, orderBody1, { headers: headers1 })
    .then((res) => {
      console.log('Order 1 response:', res.data)
    })
    .catch((e) => {
      console.log('Error in order 1:', e.response.data)
    }),
  axios
    .post(ENDPOINT, orderBody2, { headers: headers2 })
    .then((res) => {
      console.log('Order 2 response:', res.data)
    })
    .catch((e) => {
      console.log('Error in order 2:', e.response.data)
    }),
])
