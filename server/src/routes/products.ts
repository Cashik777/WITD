import { Router } from 'express'
import { productRepository } from '../data/productsDb.js'

export const productsRouter = Router()

productsRouter.get('/products', async (_req, res) => {
  const products = await productRepository.findAll()
  res.json({ products })
})
