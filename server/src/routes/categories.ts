import { Router } from 'express'
import { categoryRepository } from '../data/categoriesDb.js'

export const categoriesRouter = Router()

categoriesRouter.get('/categories', async (_req, res) => {
  const categories = await categoryRepository.findAll()
  res.json({ categories })
})
