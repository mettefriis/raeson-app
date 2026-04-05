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

const inputStyle = {
  width: '100%', padding: '8px 10px', border: '1px solid #e5e5e3',
  background: '#ffffff', fontSize: 13, fontFamily: 'inherit',
  color: '#111110', outline: 'none', boxSizing: 'border-box',
}

const labelStyle = {
  fontSize: 11, color: '#6b6b69', letterSpacing: '0.04em',
  textTransform: 'uppercase', display: 'block', marginBottom: 6,
}

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
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, color: '#9b9b99', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
          New Project
        </p>
        <p style={{ fontSize: 13, color: '#6b6b69', fontWeight: 300 }}>
          Set the project context once — all assessments inherit it.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Name + number */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Project name *</label>
              <input
                style={inputStyle}
                placeholder="e.g. Ørestad Housing Block 4B"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Project number</label>
              <input
                style={inputStyle}
                placeholder="e.g. 2024-087"
                value={form.project_number}
                onChange={e => set('project_number', e.target.value)}
              />
            </div>
          </div>

          {/* Address + city */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Address</label>
              <input
                style={inputStyle}
                placeholder="e.g. Ørestads Boulevard 55"
                value={form.address}
                onChange={e => set('address', e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input
                style={inputStyle}
                placeholder="e.g. Copenhagen"
                value={form.city}
                onChange={e => set('city', e.target.value)}
              />
            </div>
          </div>

          {/* Jurisdiction */}
          <div>
            <label style={labelStyle}>Jurisdiction</label>
            <select
              style={inputStyle}
              value={form.jurisdiction}
              onChange={e => set('jurisdiction', e.target.value)}
            >
              {JURISDICTIONS.map(j => (
                <option key={j.value} value={j.value}>{j.label}</option>
              ))}
            </select>
          </div>

          {/* Building type + class */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Building type</label>
              <select
                style={inputStyle}
                value={form.building_type}
                onChange={e => set('building_type', e.target.value)}
              >
                {BUILDING_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Building class</label>
              <select
                style={inputStyle}
                value={form.building_class}
                onChange={e => set('building_class', e.target.value)}
              >
                {BUILDING_CLASSES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Climate zone + architect */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Climate zone</label>
              <select
                style={inputStyle}
                value={form.climate_zone}
                onChange={e => set('climate_zone', e.target.value)}
              >
                {CLIMATE_ZONES.map(z => (
                  <option key={z.value} value={z.value}>{z.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Architect name</label>
              <input
                style={inputStyle}
                placeholder="e.g. Anna Møller"
                value={form.architect_name}
                onChange={e => set('architect_name', e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 20px', background: '#111110', color: '#f7f7f5',
                border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 12, fontFamily: 'inherit', opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? 'Creating...' : 'Create project'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '9px 20px', background: 'transparent', color: '#6b6b69',
                border: '1px solid #e5e5e3', cursor: 'pointer',
                fontSize: 12, fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
