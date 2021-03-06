//require('dotenv').config()
const express = require('express')
const userRoutes = require('./data/routes/userRoutes')
const schoolRoutes = require('./data/routes/schoolRoutes')
const issueRoutes = require('./data/routes/issueRoutes')
const bcrypt = require('bcryptjs')
const mwConfig = require('./data/mwConfig')
const db = require('./data/dbConfig.js')

const PORT = process.env.PORT || 5000
const server = express()
server.use(express.json())

mwConfig(server)

server.use('/api/schools', schoolRoutes)
server.use('/api/users', userRoutes)
server.use('/api/issues', issueRoutes)

const { generateToken } = require('./data/auth/authenticate')

// //AUTH ENDPOINTS
server.post('/api/register', (req, res) => {
	const user = req.body
	if (
		user.username ||
		typeof user.username !== 'string' ||
		user.username === ''
	) {
		res.status(400).json({ message: 'Username must be a valued string.' })
	} else if (
		!user.password ||
		user.password.length < 8 ||
		typeof user.password !== 'string' ||
		user.password === ''
	) {
		res.status(400).json({
			message: 'Password must be a valued string of 8 characters or more.'
		})
	} else {
		db('schools')
			.where({ id: user.school_id })
			.first()
			.then(school => {
				if (!school) {
					res.status(404).json({ error: 'invalid school id' })
				} else {
					const creds = req.body
					const hash = bcrypt.hashSync(creds.password, 12)
					creds.password = hash
					db('users')
						.insert(creds)
						.then(id => {
							res.status(201).json({ id: id[0] })
						})
				}
			})
			.catch(() => {
				res.status(500).json({ error: 'Unable to register user.' })
			})
	}
})

server.post('/api/login', (req, res) => {
	const creds = req.body
	db('users')
		.where({ username: creds.username })
		.first()
		.then(user => {
			if (user && bcrypt.compareSync(creds.password, user.password)) {
				const token = generateToken(user)
				res.status(200).json({
					message: `${user.username} is logged in`,
					token,
					id: user.id
				})
			} else {
				res.status(401).json({ message: 'You shall not pass!' })
			}
		})
		.catch(() =>
			res.status(500).json({ message: 'Please try logging in again.' })
		)
})

server.listen(PORT, () => {
	console.log(`Listening on port ${PORT}`)
})
