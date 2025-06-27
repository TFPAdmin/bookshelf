// 📁 Directory Structure
// project-root/
// ├── public/              → Static assets (favicon, etc.)
// ├── src/
// │   ├── components/      → React components
// │   ├── pages/           → Route-based pages (React)
// │   └── App.jsx
// ├── api/                 → Cloudflare Worker API
// │   └── index.js
// ├── wrangler.jsonc       → Config for Cloudflare
// ├── package.json
// ├── vite.config.js
// └── README.md

// ----------------------------
// 📄 wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "book-shelf",
  "main": "api/index.js",
  "compatibility_flags": ["nodejs_compat"],
  "compatibility_date": "2025-04-01",
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "bookshelf",
      "database_id": "replace-this-with-your-db-id"
    }
  ],
  "routes": [
    { "pattern": "books.cbreedauthor.com/*", "zone_id": "your-zone-id" }
  ]
}

// ----------------------------
// 📄 api/index.js
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'

const app = new Hono()
app.use('*', cors())

const secret = 'super-secret-key' // Change this securely

app.post('/login', async c => {
  const { username, password } = await c.req.json()
  if (username === 'admin' && password === 'admin123') {
    const token = await jwt.sign({ user: 'admin' }, secret)
    return c.json({ token })
  }
  return c.json({ error: 'Invalid login' }, 401)
})

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

app.get('/books', async c => {
  const books = await c.env.DB.prepare('SELECT * FROM books').all()
  return c.json(books.results)
})

app.post('/admin/books', async c => {
  const body = await c.req.json()
  const stmt = c.env.DB.prepare(
    'INSERT INTO books (title, subtitle, excerpt, cover, wattpad) VALUES (?, ?, ?, ?, ?)'
  ).bind(body.title, body.subtitle, body.excerpt, body.cover, body.wattpad)
  await stmt.run()
  return c.json({ status: 'added' })
})

app.put('/admin/books/:id', async c => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const stmt = c.env.DB.prepare(
    'UPDATE books SET title=?, subtitle=?, excerpt=?, cover=?, wattpad=? WHERE id=?'
  ).bind(body.title, body.subtitle, body.excerpt, body.cover, body.wattpad, id)
  await stmt.run()
  return c.json({ status: 'updated' })
})

app.delete('/admin/books/:id', async c => {
  const id = c.req.param('id')
  await c.env.DB.prepare('DELETE FROM books WHERE id=?').bind(id).run()
  return c.json({ status: 'deleted' })
})

export default app

// ----------------------------
// 📄 src/components/BookCard.jsx
import React from 'react'

export default function BookCard({ book }) {
  return (
    <div className="border rounded p-4 shadow">
      <img src={book.cover} alt={book.title} className="h-40 object-cover mb-2" />
      <h2 className="text-xl font-bold">{book.title}</h2>
      <p className="italic">{book.subtitle}</p>
      <p>{book.excerpt}</p>
      <a href={book.wattpad} className="text-blue-600 underline">Read on Wattpad</a>
    </div>
  )
}

// ----------------------------
// 📄 src/pages/Admin.jsx
import React, { useState, useEffect } from 'react'

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [books, setBooks] = useState([])
  const [form, setForm] = useState({ title: '', subtitle: '', excerpt: '', cover: '', wattpad: '' })

  useEffect(() => {
    if (token) fetchBooks()
  }, [token])

  async function fetchBooks() {
    const res = await fetch('/books')
    const data = await res.json()
    setBooks(data)
  }

  async function saveBook() {
    await fetch('/admin/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form)
    })
    fetchBooks()
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return token ? (
    <div className="p-4">
      <h2 className="text-2xl mb-2">Add a Book</h2>
      {['title', 'subtitle', 'excerpt', 'cover', 'wattpad'].map(f => (
        <input
          key={f}
          name={f}
          value={form[f]}
          onChange={handleChange}
          placeholder={f}
          className="block border p-2 mb-2 w-full"
        />
      ))}
      <button onClick={saveBook} className="bg-blue-600 text-white p-2 rounded">Save</button>

      <h2 className="text-xl mt-6">Books</h2>
      <ul>
        {books.map(book => (
          <li key={book.id}>{book.title} — {book.subtitle}</li>
        ))}
      </ul>
    </div>
  ) : (
    <LoginForm setToken={setToken} />
  )
}

function LoginForm({ setToken }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  async function login() {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
    }
  }

  return (
    <div className="p-4">
      <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} className="block mb-2 border p-2" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="block mb-2 border p-2" />
      <button onClick={login} className="bg-green-600 text-white p-2">Login</button>
    </div>
  )
}

// ----------------------------
// 📄 D1 SQL Schema (Run in Dashboard or via Wrangler CLI)
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  cover TEXT,
  wattpad TEXT
);

CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  password TEXT
);

// (Later: Add hashed passwords and multi-admin support)

// ----------------------------
// Let me know once you’ve pasted this into a project, and I’ll walk you through how to deploy it!
