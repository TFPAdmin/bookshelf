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
