import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
import { getOdooProduct, getOdooProductCategories, getOdooStockQuants, getOdooValuationLayers, updateOdooProduct, createOdooProduct, BACKEND_WAKEUP_MESSAGE } from '../services/ServiceGateway'

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useLang()
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [item, setItem] = useState(null)
  const [categories, setCategories] = useState([])
  const [quants, setQuants] = useState([])
  const [valuationLayers, setValuationLayers] = useState([])
  const [form, setForm] = useState({ default_code: '', name: '', list_price: 0, categ_id: undefined })

  const normalizeErrorMessage = (err) => {
    const raw = err?.response?.data?.error || err?.message || t('error')
    return raw === BACKEND_WAKEUP_MESSAGE ? t('backendWakingUp') : raw
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [categoryResult, productResult] = await Promise.all([
          getOdooProductCategories(100, {}),
          id && id !== 'new' ? getOdooProduct(id) : Promise.resolve(null),
        ])
        if (mounted) {
          setCategories(Array.isArray(categoryResult) ? categoryResult : [])
          if (productResult) {
            setItem(productResult)
            setForm({
              default_code: productResult?.default_code || '',
              name: productResult?.name || '',
              list_price: productResult?.list_price || 0,
              categ_id: productResult?.categ_id?.[0],
            })
          }
        }
      } catch (err) {
        if (mounted) setError(normalizeErrorMessage(err))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (authLoading || !currentUser) return
    load()
    return () => (mounted = false)
  }, [id, authLoading, currentUser])

  // TICKET-021 Task 6.5: Load stock quants for existing products
  useEffect(() => {
    let mounted = true
    async function loadQuants() {
      try {
        if (!id || id === 'new') return
        const quantResult = await getOdooStockQuants(50, { productId: Number(id) })
        if (mounted) {
          setQuants(Array.isArray(quantResult) ? quantResult : [])
        }
      } catch {
        // ignore quant load failures; panel can show empty
      }
    }
    if (authLoading || !currentUser) return
    loadQuants()
    return () => (mounted = false)
  }, [id, authLoading, currentUser])

  // TICKET-022 Task 6: Load stock valuation layers
  useEffect(() => {
    let mounted = true
    async function loadValuation() {
      try {
        if (!id || id === 'new') return
        const valResult = await getOdooValuationLayers(Number(id))
        if (mounted) {
          setValuationLayers(Array.isArray(valResult) ? valResult : [])
        }
      } catch {
        // ignore valuation load failures; panel can show empty
      }
    }
    if (authLoading || !currentUser) return
    loadValuation()
    return () => (mounted = false)
  }, [id, authLoading, currentUser])

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (id === 'new') {
        const created = await createOdooProduct({
          default_code: form.default_code,
          name: form.name,
          list_price: Number(form.list_price || 0),
          categ_id: form.categ_id ? Number(form.categ_id) : undefined,
        }, { actorUid: currentUser?.uid })
        if (!created?.id) {
          throw new Error('Failed to create product in Odoo.')
        }
        navigate(`/inventory/${created.id}`)
        return
      }

      const updated = await updateOdooProduct(id, {
        default_code: form.default_code,
        name: form.name,
        list_price: Number(form.list_price || 0),
        categ_id: form.categ_id ? Number(form.categ_id) : undefined,
      }, { actorUid: currentUser?.uid })
      setItem(updated)
      setForm({
        default_code: updated?.default_code || '',
        name: updated?.name || '',
        list_price: updated?.list_price || 0,
      })
    } catch (err) {
      setError(normalizeErrorMessage(err))
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
              <label className="block text-xs text-gray-600 mb-1">{t('category')}</label>
              <select
                value={form.categ_id || ''}
                onChange={(e) => setForm({ ...form, categ_id: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full p-2 border rounded"
              >
                <option value="">{t('selectCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.complete_name || category.name}
                  </option>
                ))}
              </select>
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
            <div className="flex justify-between items-center">
              <button type="button" onClick={() => navigate('/inventory')} className="px-3 py-1 border rounded">
                {t('cancel')}
              </button>
              <button type="submit" className="px-3 py-1 bg-violet-600 text-white rounded">
                {t('save')}
              </button>
            </div>
          </form>
        )}

        {/* TICKET-021 Task 6.5: Stock by location panel (read-only) */}
        {id && id !== 'new' && (
          <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
            <h3 className="text-sm font-semibold mb-3">{t('stockByLocation')}</h3>
            {quants.length === 0 ? (
              <p className="text-xs text-gray-500">{t('noStockData')}</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2">{t('location')}</th>
                    <th className="py-2">{t('onHand')}</th>
                    <th className="py-2">{t('reserved')}</th>
                  </tr>
                </thead>
                <tbody>
                  {quants.map((quant) => (
                    <tr key={quant.id} className="border-t">
                      <td className="py-2">{quant.location_id?.[1] || '—'}</td>
                      <td className="py-2">{typeof quant.quantity === 'number' ? quant.quantity : '—'}</td>
                      <td className="py-2">{typeof quant.reserved_quantity === 'number' ? quant.reserved_quantity : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TICKET-022 Task 6: FIFO Valuation Layers panel (read-only) */}
        {id && id !== 'new' && (
          <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded shadow-sm">
            <h3 className="text-sm font-semibold mb-3">{t('valuationLayers')}</h3>
            {valuationLayers.length === 0 ? (
              <p className="text-xs text-gray-500">{t('noValuationData')}</p>
            ) : (
              <>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2">{t('date')}</th>
                      <th className="py-2">{t('quantity')}</th>
                      <th className="py-2">{t('unitCost')}</th>
                      <th className="py-2">{t('totalValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valuationLayers.map((layer) => (
                      <tr key={layer.id} className="border-t">
                        <td className="py-2">
                          {layer.create_date
                            ? new Date(layer.create_date.replace(' ', 'T') + 'Z').toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="py-2">{typeof layer.quantity === 'number' ? layer.quantity : '—'}</td>
                        <td className="py-2">
                          {typeof layer.unit_cost === 'number'
                            ? `$${layer.unit_cost.toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="py-2">
                          {typeof layer.value === 'number'
                            ? `$${layer.value.toFixed(2)}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('valuation')}: $
                  {valuationLayers
                    .reduce((sum, layer) => sum + (layer.value || 0), 0)
                    .toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
