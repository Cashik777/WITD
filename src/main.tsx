import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { CartProvider } from '@/context/CartContext'
import { ProductsProvider } from '@/context/ProductsContext'
import { CustomerAuthProvider } from '@/context/CustomerAuthContext'
import '@/styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ProductsProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </CustomerAuthProvider>
      </ProductsProvider>
    </BrowserRouter>
  </React.StrictMode>
)
