import React, { useEffect, useState } from 'react'
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
                  next[key] = data.imageUrl ?? null
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div style={{ marginTop: 12 }}>
          <table className="modal-thumb-table">
            <tbody>
              {Array.from({ length: SIZE }, (_, rIdx) => {
                const r = rIdx + 1
                return (
                  <tr key={r}>
                    {Array.from({ length: SIZE }, (_, cIdx) => {
                      const c = cIdx + 1
                      const key = `${r}-${c}`
                      const url = thumbs[key]
                      return (
                        <td key={c}>
                          <button
                            onClick={() => onSelectDetail(r, c)}
                            className="modal-thumb-button"
                            aria-label={`詳細へ ${r},${c}`}
                          >
                            {url ? (
                              <img
                                src={url}
                                alt={`thumb ${r},${c}`}
                                className="modal-thumb-img"
                              />
                            ) : (
                              <div className="modal-thumb-placeholder">N/A</div>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
