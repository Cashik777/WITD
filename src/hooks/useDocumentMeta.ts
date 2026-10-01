import { useEffect } from 'react'

// The SPA only ships one static <title>/<meta description> in index.html —
// fine for the crawler that just wants *a* title, but every page reading
// identically in search results and browser tabs is a real gap. This swaps
// them in per-page and restores the previous values on unmount, so
// navigating between pages never leaves a stale title behind.
export function useDocumentMeta(title: string, description?: string) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    const descTag = description ? document.querySelector('meta[name="description"]') : null
    const previousDescription = descTag?.getAttribute('content') ?? null
    if (descTag && description) {
      descTag.setAttribute('content', description)
    }

    return () => {
      document.title = previousTitle
      if (descTag && previousDescription !== null) {
        descTag.setAttribute('content', previousDescription)
      }
    }
  }, [title, description])
}
