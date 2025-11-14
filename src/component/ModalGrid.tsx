import React, { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

type Props = {
  parentCell: { r: number; c: number }
  onClose: () => void
  onSelectDetail: (r: number, c: number) => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: +1,
}

const boxStyle: React.CSSProperties = {
  background: '#fff',
  padding: '16px',
  borderRadius: '6px',
  minWidth: '320px',
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

  const imgSize = 56

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ marginTop: '12px' }}>
          <table style={{ borderCollapse: 'collapse' }}>
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
                        <td key={c} style={{ padding: '6px', width: `${imgSize}px`, height: `${imgSize}px`, verticalAlign: 'middle' }}>
                          <button
                            onClick={() => onSelectDetail(r, c)}
                            style={{ width: `${imgSize}px`, height: `${imgSize}px`, padding: 0, border: '1px solid #ddd', background: 'transparent' }}
                            aria-label={`詳細へ ${r},${c}`}
                          >
                            {url ? (
                              <img
                                src={url}
                                alt={`thumb ${r},${c}`}
                                style={{
                                  width: `${imgSize}px`,
                                  height: `${imgSize}px`,
                                  objectFit: 'cover',
                                  display: 'block',
                                }}
                              />
                            ) : (
                              <div style={{
                                width: `${imgSize}px`,
                                height: `${imgSize}px`,
                                background: '#eee',
                                color: '#666',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                userSelect: 'none'
                              }}>
                                N/A
                              </div>
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
