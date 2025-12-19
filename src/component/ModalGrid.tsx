import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

type Props = {
  parentCell: { r: number; c: number }
  onClose: () => void
  onSelectDetail: (r: number, c: number) => void
}

export default function ModalGrid({ parentCell, onClose, onSelectDetail }: Props) {
  const SIZE = 4
  const [thumbs, setThumbs] = useState<Record<string, string | null>>({}) // key: "r-c"

  useEffect(() => {
    let mounted = true
    const fetchThumbs = async () => {
      const promises: Promise<void>[] = []
      const next: Record<string, string | null> = {}
      for (let r = 1; r <= SIZE; r++) {
        for (let c = 1; c <= SIZE; c++) {
          const id = `R${parentCell.r}C${parentCell.c}-r${r}c${c}`
          const key = `${r}-${c}`
          promises.push(
            (async () => {
              try {
                const snap = await getDoc(doc(db, 'details', id))
                if (snap.exists()) {
                  const data = snap.data() as { imageUrl?: string }
                  const img = data.imageUrl ?? null
                  if (!img || img === 'no_URL' || typeof img !== 'string' || !/^https?:\/\//.test(img)) {
                    next[key] = null
                  } else {
                    next[key] = img
                  }
                } else {
                  next[key] = null
                }
              } catch {
                next[key] = null
              }
            })()
          )
        }
      }
      await Promise.all(promises)
      if (mounted) setThumbs(next)
    }
    fetchThumbs()
    return () => { mounted = false }
  }, [parentCell])

  const entries: { r: number; c: number; url: string }[] = []
  for (let r = 1; r <= SIZE; r++) {
    for (let c = 1; c <= SIZE; c++) {
      const key = `${r}-${c}`
      const url = thumbs[key]
      if (typeof url === 'string' && /^https?:\/\//.test(url)) {
        entries.push({ r, c, url })
      }
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginTop: 12 }}>
          <div
            className="modal-thumb-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${SIZE}, 56px)`,
              gap: 8,
              justifyContent: 'center',
            }}
          >
            {entries.map(({ r, c, url }) => {
              const key = `${r}-${c}`
              return (
                <button
                  key={key}
                  onClick={() => onSelectDetail(r, c)}
                  className="modal-thumb-button"
                  aria-label={`詳細へ ${r},${c}`}
                  style={{ padding: 0, border: 'none', background: 'transparent' }}
                >
                  <img
                    src={url}
                    alt={`thumb ${r},${c}`}
                    className="modal-thumb-img"
                    onError={(e) => {
                      const btn = (e.currentTarget.closest('button') as HTMLButtonElement | null)
                      if (btn) btn.style.display = 'none'
                    }}
                    style={{ width: '56px', height: '56px', objectFit: 'cover' }}
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
