import React, { useEffect, useMemo, useState } from 'react'
import '../../styles/cart.css'

function readCart() {
  try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
}
function writeCart(items) {
  localStorage.setItem('cart', JSON.stringify(items))
}

const Cart = () => {
  const [items, setItems] = useState(() => readCart())

  useEffect(() => { writeCart(items) }, [items])

  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.price || 0) * (it.qty || 0)), 0)
  }, [items])
  const totalQty = useMemo(() => items.reduce((n, it) => n + (it.qty || 0), 0), [items])

  const inc = (id) => setItems(prev => prev.map(it => it._id === id ? { ...it, qty: (it.qty || 0) + 1 } : it))
  const dec = (id) => setItems(prev => prev.flatMap(it => {
    if (it._id !== id) return it
    const next = (it.qty || 0) - 1
    return next > 0 ? { ...it, qty: next } : []
  }))
  const remove = (id) => setItems(prev => prev.filter(it => it._id !== id))
  const clear = () => setItems([])

  const checkout = () => {
    window.toast?.('Checkout coming soon', { type: 'info' })
  }

  return (
    <main className="cart-page">
      <header className="cart-head">
        <h1 className="cart-title">Your Cart</h1>
        <span className="cart-subtitle">{totalQty} item{totalQty !== 1 ? 's' : ''}</span>
      </header>

      {items.length === 0 ? (
        <div className="cart-empty">Your cart is empty.</div>
      ) : (
        <div className="cart-grid">
          <section className="cart-list" aria-label="Items">
            {items.map(item => (
              <article key={item._id} className="cart-item">
                <div className="cart-thumb">
                  <video src={item.video} muted playsInline loop />
                </div>
                <div className="cart-info">
                  <div className="cart-row">
                    <h2 className="cart-name">{item.name || 'Food item'}</h2>
                    <div className="cart-price">{Number(item.price || 0).toFixed(2)}</div>
                  </div>
                  <p className="cart-desc">{item.description || ''}</p>
                  <div className="cart-controls">
                    <div className="qty">
                      <button className="qty-btn" onClick={() => dec(item._id)} aria-label="Decrease">−</button>
                      <span className="qty-value" aria-live="polite">{item.qty || 0}</span>
                      <button className="qty-btn" onClick={() => inc(item._id)} aria-label="Increase">+</button>
                    </div>
                    <button className="remove-btn" onClick={() => remove(item._id)}>Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <aside className="cart-summary" aria-label="Order summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-actions">
              <button className="btn-outline" onClick={clear}>Clear cart</button>
              <button className="btn-primary" onClick={checkout}>Proceed to checkout</button>
            </div>
            <p className="summary-note">Prices are placeholders; integrate pricing from the backend when available.</p>
          </aside>
        </div>
      )}
    </main>
  )
}

export default Cart
