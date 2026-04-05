import React, { useState, useEffect } from 'react'

export default function CodeProvisionModal({ codeReference, onClose }) {
  const [provision, setProvision] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchProvision() {
      try {
        const res = await fetch(`/api/code/${encodeURIComponent(codeReference)}`)
        if (!res.ok) throw new Error('Provision not found')
        const data = await res.json()
        setProvision(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProvision()
  }, [codeReference])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.35)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', maxWidth: 600,
          width: '100%', maxHeight: '80vh', overflowY: 'auto',
          padding: '24px 28px',
          border: '1px solid #e5e5e3',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 20,
          paddingBottom: 16, borderBottom: '1px solid #e5e5e3',
        }}>
          <div>
            <div style={{
              fontSize: 10, color: '#9b9b99', letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: 4,
            }}>
              Code provision
            </div>
            <div style={{ fontSize: 15, fontWeight: 400, color: '#111110' }}>
              {codeReference}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 18,
              cursor: 'pointer', color: '#9b9b99', padding: '0 4px',
              lineHeight: 1, fontFamily: 'inherit',
            }}
          >
            ×
          </button>
        </div>

        {loading && (
          <div style={{ padding: 20, textAlign: 'center', color: '#9b9b99', fontWeight: 300 }}>
            Loading provision...
          </div>
        )}

        {error && (
          <div style={{
            padding: '12px 16px', background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b', fontSize: 13, fontWeight: 300,
          }}>
            {error}
          </div>
        )}

        {provision && (
          <div>
            {/* Document context */}
            <div style={{
              background: '#f7f7f5',
              padding: '12px 16px', marginBottom: 16,
              fontSize: 12, color: '#6b6b69', fontWeight: 300,
              border: '1px solid #e5e5e3',
            }}>
              <div style={{ fontWeight: 400, color: '#111110', marginBottom: 2 }}>
                {provision.document}
              </div>
              {provision.chapter && <div>{provision.chapter}</div>}
              {provision.section && <div>{provision.section}</div>}
            </div>

            {/* Dutch text */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 400, color: '#9b9b99',
                marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Origineel (NL)
              </div>
              <div style={{
                fontSize: 13, lineHeight: 1.75, color: '#333', fontWeight: 300,
                padding: '12px 16px', background: '#f7f7f5',
                borderLeft: '3px solid #111110',
                fontStyle: 'italic',
              }}>
                {provision.text_nl}
              </div>
            </div>

            {/* English translation */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 400, color: '#9b9b99',
                marginBottom: 6, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                Translation (EN)
              </div>
              <div style={{
                fontSize: 13, lineHeight: 1.75, color: '#333', fontWeight: 300,
                padding: '12px 16px', background: '#f7f7f5',
                borderLeft: '3px solid #e5e5e3',
              }}>
                {provision.text_en}
              </div>
            </div>

            {/* Key details */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
              marginBottom: 16,
            }}>
              {provision.applicable_to && (
                <div style={{
                  background: '#f7f7f5', padding: '8px 12px',
                  border: '1px solid #e5e5e3',
                }}>
                  <div style={{ fontSize: 10, color: '#9b9b99', marginBottom: 2 }}>Applies to</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: '#111110' }}>
                    {provision.applicable_to}
                  </div>
                </div>
              )}
              {provision.minimum_fire_class && (
                <div style={{
                  background: '#f7f7f5', padding: '8px 12px',
                  border: '1px solid #e5e5e3',
                }}>
                  <div style={{ fontSize: 10, color: '#9b9b99', marginBottom: 2 }}>Required class</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: '#111110' }}>
                    {provision.minimum_fire_class}
                  </div>
                </div>
              )}
              {provision.minimum_fire_resistance && (
                <div style={{
                  background: '#f7f7f5', padding: '8px 12px',
                  border: '1px solid #e5e5e3',
                }}>
                  <div style={{ fontSize: 10, color: '#9b9b99', marginBottom: 2 }}>Required resistance</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: '#111110' }}>
                    {provision.minimum_fire_resistance}
                  </div>
                </div>
              )}
              {provision.values && Object.entries(provision.values).map(([k, v]) => (
                <div key={k} style={{
                  background: '#f7f7f5', padding: '8px 12px',
                  border: '1px solid #e5e5e3',
                }}>
                  <div style={{ fontSize: 10, color: '#9b9b99', marginBottom: 2 }}>{k}</div>
                  <div style={{ fontSize: 12, fontWeight: 400, color: '#111110' }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Source link */}
            {provision.url && (
              <a
                href={provision.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block', fontSize: 12, color: '#111110', fontWeight: 400,
                  textDecoration: 'none', padding: '6px 12px',
                  border: '1px solid #e5e5e3',
                  transition: 'border-color 0.1s',
                }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#111110'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#e5e5e3'}
              >
                View on wetten.overheid.nl →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
