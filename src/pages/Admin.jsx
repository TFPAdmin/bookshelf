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
