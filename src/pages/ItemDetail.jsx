import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { getOdooProduct, updateOdooProduct } from '../services/ServiceGateway'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [item, setItem] = useState(null)
  const [form, setForm] = useState({ default_code: '', name: '', list_price: 0 })

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id || id === 'new') return
      setLoading(true)
      setError('')
      try {
        const data = await getOdooProduct(id)
        if (mounted) {
          setItem(data)
          setForm({
            default_code: data?.default_code || '',
            name: data?.name || '',
            list_price: data?.list_price || 0,
          })
        }
      } catch (err) {
        if (mounted) setError(err?.message || 'Failed to load product from Odoo.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => (mounted = false)
  }, [id])

  async function submit(e) {
    e.preventDefault()
    if (!id || id === 'new') return
    setLoading(true)
    setError('')
    try {
      const updated = await updateOdooProduct(id, {
        default_code: form.default_code,
        name: form.name,
        list_price: Number(form.list_price || 0),
      })
      setItem(updated)
      setForm({
        default_code: updated?.default_code || '',
        name: updated?.name || '',
        list_price: updated?.list_price || 0,
      })
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to update product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {id === 'new' ? t('newProduct') : `${t('product')} ${item?.default_code || id}`}
          </h2>
          <button onClick={() => navigate('/inventory')} className="text-sm text-gray-500">
            {t('back')}
          </button>
        </div>

        {loading ? (
          <p>{t('loading')}</p>
        ) : id === 'new' ? (
          <div className="rounded border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
            {t('productCreateNotSupported')}
          </div>
        ) : error ? (
          <div className="space-y-3">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('sku')}</label>
              <input
                value={form.default_code}
                onChange={(e) => setForm({ ...form, default_code: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('name')}</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{t('price')}</label>
              <input
                type="number"
                value={form.list_price}
                onChange={(e) => setForm({ ...form, list_price: Number(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => navigate('/inventory')} className="px-3 py-1 border rounded">
                {t('cancel')}
              </button>
              <button type="submit" className="px-3 py-1 bg-violet-600 text-white rounded">
                {t('save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
