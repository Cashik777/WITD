import type { FulfillmentProvider } from './FulfillmentProvider.js'
import { PrintfulProvider } from './PrintfulProvider.js'
import { PrintifyProvider } from './PrintifyProvider.js'
import { MockProvider } from './MockProvider.js'

// Selects a provider by name, falling back to MockProvider whenever the
// requested provider's credentials aren't configured yet. This is the one
// place that needs to change to add a third provider later.
export function getFulfillmentProvider(name: 'printful' | 'printify' | 'mock'): FulfillmentProvider {
  if (name === 'printful' && process.env.PRINTFUL_API_KEY && process.env.PRINTFUL_STORE_ID) {
    return new PrintfulProvider(process.env.PRINTFUL_API_KEY, process.env.PRINTFUL_STORE_ID)
  }
  if (name === 'printify' && process.env.PRINTIFY_API_KEY && process.env.PRINTIFY_SHOP_ID) {
    return new PrintifyProvider(process.env.PRINTIFY_API_KEY, process.env.PRINTIFY_SHOP_ID)
  }
  return new MockProvider()
}
