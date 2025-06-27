import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'

const app = new Hono()
app.use('*', cors())

const secret = 'super-secret-key' // Change this to a secure random string

// Public login route
app.post('/login', async c => {
  const { username, password } = await c.req.json()
  if (username === 'admin' && password === 'admin123') {
    const token = await jwt.sign({ user: 'admin' }, secret)
    return c.json({ token })
  }
  return c.json({ error: 'Invalid login' }, 401)
})

// Protect all /admin/* routes with token
app.use('/admin/*', async (c, next) => {
  const auth = c.req.header('Authorization')?.replace('Bearer ', '')
  if (!auth) return c.json({ error: 'Unauthorized' }, 401)
  try {
    await jwt.verify(auth, secret)
    await next()
  } catch (_) {
    return c.json({ error: 'Invalid token' }, 403)
  }
})

// Get all books
app.get('/books', async c => {
  const books = await c.env.DB.prepare('SELECT * FROM books').all()
  return c.json(books.results)
})

// Add a new book
app.post('/admin/books', async c => {
  const body = await c.req.json()
  const stmt = c.env.DB.prepare(
    'INSERT INTO books (title, subtitle, excerpt, cover, wattpad) VALUES (?, ?, ?, ?, ?)'
  ).bind(body.title, body.subtitle, body.excerpt, body.cover, body.wattpad)
  await stmt.run()
  return c.json({ status: 'added' })
})

// Update a book
app.put('/admin/books/:id', async c => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const stmt = c.env.DB.prepare(
    'UPDATE books SET title=?, subtitle=?, excerpt=?, cover=?, wattpad=? WHERE id=?'
  ).bind(body.title, body.subtitle, body.excerpt, body.cover, body.wattpad, id)
  await stmt.run()
  return c.json({ status: 'updated' })
})

// Delete a book
app.delete('/admin/books/:id', async c => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM books WHERE id=?').bind(id).run()
  return c.json({ status: 'deleted' })
})

export default app
