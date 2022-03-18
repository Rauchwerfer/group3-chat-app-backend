const jwt = require('jsonwebtoken')

// Verification of a token
/**
 * Return if User ID is equal to ID signed in token
 *
 * @param {Request} req Request
 * @param {Response} res Response
 * @param {Function} next Next function after passing middleware
 * @return {Function} Next function or response with status 401 Unauthorized
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403)
    res.locals.userId = decoded.id
    next()
  })
} 

// Compares User id in token and in query to check if user can do this
/**
 * Return if User ID is equal to id signed in token
 *
 * @param {String} clientId User ID from request body or params
 * @param {String} authHeader Authorization Header of the request
 * @return {Boolean} Client authorized successfully?
 */
function authorizeClient(clientId, authHeader) {
  let result
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) result = false

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) result = false
    if (clientId == decoded.id) result = true
  }) 
  return result 
}

module.exports = { authenticateToken, authorizeClient }