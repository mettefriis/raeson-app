import React, { useState, useEffect } from 'react'
import { motion } from 'motion/react'

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      className="fixed inset-0 z-[1000] flex items-center justify-center p-5"
      style={{ background: 'rgba(0,0,0,0.35)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full max-h-[80vh] overflow-y-auto px-7 py-6 border border-rule rounded-2xl"
        style={{ maxWidth: 600, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-rule">
          <div>
            <div className="text-10 text-muted font-normal mb-1" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Code provision
            </div>
            <div className="text-15 font-normal text-ink">{codeReference}</div>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors duration-100 text-lg leading-none px-1 bg-transparent border-none"
          >
            ×
          </button>
        </div>

        {loading && (
          <div className="py-5 text-center text-muted text-13">
            Loading provision...
          </div>
        )}

        {error && (
          <div className="px-4 py-3 bg-fail-light border border-fail-edge text-fail text-13 rounded-lg">
            {error}
          </div>
        )}

        {provision && (
          <div>
            {/* Document context */}
            <div className="bg-surface px-4 py-3 mb-4 text-12 text-subtle border border-rule rounded-lg">
              <div className="font-normal text-ink mb-0.5">{provision.document}</div>
              {provision.chapter && <div>{provision.chapter}</div>}
              {provision.section && <div>{provision.section}</div>}
            </div>

            {/* Dutch text */}
            <div className="mb-4">
              <div className="text-10 text-muted font-normal mb-1.5" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Origineel (NL)
              </div>
              <div
                className="text-13 leading-7 text-subtle px-4 py-3 bg-surface italic rounded-lg"
                style={{ borderLeft: '3px solid #009767' }}
              >
                {provision.text_nl}
              </div>
            </div>

            {/* English translation */}
            <div className="mb-4">
              <div className="text-10 text-muted font-normal mb-1.5" style={{ letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Translation (EN)
              </div>
              <div
                className="text-13 leading-7 text-subtle px-4 py-3 bg-surface rounded-lg"
                style={{ borderLeft: '3px solid #e5e5e5' }}
              >
                {provision.text_en}
              </div>
            </div>

            {/* Key details */}
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {provision.applicable_to && (
                <div className="bg-surface px-3 py-2 border border-rule rounded-lg">
                  <div className="text-10 text-muted mb-0.5">Applies to</div>
                  <div className="text-12 font-normal text-ink">{provision.applicable_to}</div>
                </div>
              )}
              {provision.minimum_fire_class && (
                <div className="bg-surface px-3 py-2 border border-rule rounded-lg">
                  <div className="text-10 text-muted mb-0.5">Required class</div>
                  <div className="text-12 font-normal text-ink">{provision.minimum_fire_class}</div>
                </div>
              )}
              {provision.minimum_fire_resistance && (
                <div className="bg-surface px-3 py-2 border border-rule rounded-lg">
                  <div className="text-10 text-muted mb-0.5">Required resistance</div>
                  <div className="text-12 font-normal text-ink">{provision.minimum_fire_resistance}</div>
                </div>
              )}
              {provision.values && Object.entries(provision.values).map(([k, v]) => (
                <div key={k} className="bg-surface px-3 py-2 border border-rule">
                  <div className="text-10 text-muted mb-0.5">{k}</div>
                  <div className="text-12 font-normal text-ink">{v}</div>
                </div>
              ))}
            </div>

            {/* Source link */}
            {provision.url && (
              <a
                href={provision.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-12 text-ink font-medium no-underline px-3 py-1.5 border border-rule rounded-lg hover:border-ink transition-colors duration-150"
              >
                View on wetten.overheid.nl →
              </a>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
