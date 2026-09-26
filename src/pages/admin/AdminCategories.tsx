import { useEffect, useState, type FormEvent } from 'react'
import { adminApi } from '@/lib/adminApi'
import type { Category } from '@/types/category'

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [groupName, setGroupName] = useState('')
  const [subName, setSubName] = useState('')
  const [subParentId, setSubParentId] = useState('')

  const load = () => {
    setLoading(true)
    adminApi
      .listCategories()
      .then((data) => setCategories(data.categories))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const topLevel = categories.filter((c) => !c.parentId)
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id)

  const handleAddGroup = async (e: FormEvent) => {
    e.preventDefault()
    if (!groupName.trim()) return
    try {
      await adminApi.createCategory({ name: groupName.trim() })
      setGroupName('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create group.')
    }
  }

  const handleAddSub = async (e: FormEvent) => {
    e.preventDefault()
    if (!subName.trim() || !subParentId) return
    try {
      await adminApi.createCategory({ name: subName.trim(), parentId: subParentId })
      setSubName('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create subgroup.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return
    try {
      await adminApi.deleteCategory(id)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete — it may still be in use.')
    }
  }

  const input =
    'flex-1 bg-transparent border border-mist/50 focus:border-paper px-3 py-2.5 text-sm text-paper outline-none transition-colors'

  return (
    <div>
      <h1 className="font-display text-2xl text-paper mb-6">Categories</h1>
      {error && <p className="text-xs text-[#B5674F] mb-4">{error}</p>}

      <div className="max-w-xl space-y-8">
        <form onSubmit={handleAddGroup} className="flex gap-3">
          <input className={input} placeholder="New group name (e.g. Hoodies)" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <button type="submit" className="px-5 py-2.5 bg-paper text-black text-xs tracking-widest uppercase hover:bg-white transition-colors">
            Add Group
          </button>
        </form>

        <form onSubmit={handleAddSub} className="flex gap-3">
          <select className={input} value={subParentId} onChange={(e) => setSubParentId(e.target.value)}>
            <option value="">Parent group…</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input className={input} placeholder="New subgroup name" value={subName} onChange={(e) => setSubName(e.target.value)} />
          <button type="submit" className="px-5 py-2.5 border border-paper text-paper text-xs tracking-widest uppercase hover:bg-paper hover:text-black transition-colors">
            Add Subgroup
          </button>
        </form>
      </div>

      {loading ? (
        <p className="text-sm text-mist mt-8">Loading…</p>
      ) : (
        <div className="mt-8 border border-line divide-y divide-line max-w-xl">
          {topLevel.map((group) => (
            <div key={group.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-paper">{group.name}</p>
                <button
                  onClick={() => handleDelete(group.id, group.name)}
                  className="text-xs text-[#B5674F] underline underline-offset-4 hover:text-[#B5674F]/70"
                >
                  Delete
                </button>
              </div>
              {childrenOf(group.id).length > 0 && (
                <div className="mt-2 ml-4 space-y-1.5">
                  {childrenOf(group.id).map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between">
                      <p className="text-xs text-paper/70">— {sub.name}</p>
                      <button
                        onClick={() => handleDelete(sub.id, sub.name)}
                        className="text-xs text-[#B5674F] underline underline-offset-4 hover:text-[#B5674F]/70"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {topLevel.length === 0 && <p className="px-4 py-6 text-sm text-mist">No categories yet.</p>}
        </div>
      )}
    </div>
  )
}
