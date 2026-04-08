import React, { useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

const API_BASE = import.meta.env.VITE_API_URL || ''

const BUILDING_TYPES = [
  { value: '', label: 'Select building type' },
  { value: 'etageboliger', label: 'Etageboliger (DK — apartment building)' },
  { value: 'enfamiliehuse', label: 'Enfamiliehuse (DK — single family)' },
  { value: 'rækkehuse', label: 'Rækkehuse (DK — terraced houses)' },
  { value: 'erhverv', label: 'Erhverv (DK — commercial)' },
  { value: 'institutioner', label: 'Institutioner (DK — institutional)' },
  { value: 'woonfunctie', label: 'Woonfunctie (NL — residential)' },
  { value: 'kantoorfunctie', label: 'Kantoorfunctie (NL — office)' },
  { value: 'onderwijsfunctie', label: 'Onderwijsfunctie (NL — education)' },
  { value: 'gezondheidszorgfunctie', label: 'Gezondheidszorgfunctie (NL — healthcare)' },
]

const BUILDING_CLASSES = [
  { value: '', label: 'Select building class' },
  { value: 'klasse_1', label: 'Klasse 1 — low-rise (1–3 floors)' },
  { value: 'klasse_2', label: 'Klasse 2 — mid-rise (4+ floors)' },
  { value: 'klasse_3', label: 'Klasse 3 — high-rise (>70m)' },
]

const CLIMATE_ZONES = [
  { value: '', label: 'Select climate zone' },
  { value: 'urban', label: 'Urban' },
  { value: 'coastal', label: 'Coastal (within ~20km of sea)' },
  { value: 'continental', label: 'Continental' },
]

const JURISDICTIONS = [
  { value: 'NL', label: 'Netherlands (Bbl)' },
  { value: 'DK', label: 'Denmark (BR25)' },
  { value: 'SE', label: 'Sweden (BBR)' },
  { value: 'NO', label: 'Norway (TEK17)' },
  { value: 'DE', label: 'Germany (GEG)' },
]

const fieldClass = "w-full px-3 py-2 border border-rule bg-white text-13 text-ink rounded-lg transition-colors duration-150"
const labelClass = "text-11 text-subtle font-medium block mb-1.5"

export default function ProjectForm({ onCreated, onCancel }) {
  const { getToken } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    name: '',
    project_number: '',
    address: '',
    city: '',
    building_type: '',
    building_class: '',
    climate_zone: '',
    jurisdiction: 'NL',
    architect_name: '',
  })

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Project name is required'); return }
    setSaving(true)
    setError(null)
    try {
      const token = await getToken()
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`Failed to create project (${res.status}): ${body}`)
      }
      const project = await res.json()
      onCreated(project)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="text-11 text-muted mb-1" style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          New Project
        </p>
        <p className="text-13 text-subtle">
          Set the project context once — all assessments inherit it.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-5">

          {/* Name + number */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Project name *
              </label>
              <input
                className={fieldClass}
                placeholder="e.g. Ørestad Housing Block 4B"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Project number
              </label>
              <input
                className={fieldClass}
                placeholder="e.g. 2024-087"
                value={form.project_number}
                onChange={e => set('project_number', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </div>

          {/* Address + city */}
          <div className="grid gap-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Address
              </label>
              <input
                className={fieldClass}
                placeholder="e.g. Ørestads Boulevard 55"
                value={form.address}
                onChange={e => set('address', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                City
              </label>
              <input
                className={fieldClass}
                placeholder="e.g. Copenhagen"
                value={form.city}
                onChange={e => set('city', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Jurisdiction
            </label>
            <select
              className={fieldClass}
              value={form.jurisdiction}
              onChange={e => set('jurisdiction', e.target.value)}
              onFocus={e => e.target.style.borderColor = '#171717'}
              onBlur={e => e.target.style.borderColor = '#e5e5e5'}
            >
              {JURISDICTIONS.map(j => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>

          {/* Building type + class */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Building type
              </label>
              <select
                className={fieldClass}
                value={form.building_type}
                onChange={e => set('building_type', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              >
                {BUILDING_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Building class
              </label>
              <select
                className={fieldClass}
                value={form.building_class}
                onChange={e => set('building_class', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              >
                {BUILDING_CLASSES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Climate zone + architect */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Climate zone
              </label>
              <select
                className={fieldClass}
                value={form.climate_zone}
                onChange={e => set('climate_zone', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              >
                {CLIMATE_ZONES.map(z => (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} style={{ letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Architect name
              </label>
              <input
                className={fieldClass}
                placeholder="e.g. Anna Møller"
                value={form.architect_name}
                onChange={e => set('architect_name', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#171717'}
                onBlur={e => e.target.style.borderColor = '#e5e5e5'}
              />
            </div>
          </div>

          {error && (
            <div className="px-3.5 py-2.5 bg-fail-light border border-fail-edge text-fail text-13 rounded-lg">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-white text-12 font-medium rounded-lg transition-opacity duration-150 disabled:opacity-60"
              style={{ background: '#009767', letterSpacing: '-0.01em' }}
            >
              {saving ? 'Creating...' : 'Create project'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-surface text-subtle text-12 border border-rule rounded-lg hover:border-ink hover:text-ink transition-colors duration-150"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
