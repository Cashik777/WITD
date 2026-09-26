import { useContext } from 'react'
import { CustomerAuthContext } from '@/context/CustomerAuthContext'

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext)
  if (!ctx) throw new Error('useCustomerAuth must be used within a CustomerAuthProvider')
  return ctx
}
