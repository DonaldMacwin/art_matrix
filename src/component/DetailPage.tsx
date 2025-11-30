import React, { useEffect, useState, useRef } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { ROW_LABELS, COL_LABELS } from '../common/labels'
import '../css/App.css'

type DetailData = {
  title?: string
  author?: string
  year?: string
  description?: string
  imageUrl?: string
  tags?: string[]
}

type Props = {
  id: string
  onBack: () => void
}

export default function DetailPage({ id, onBack }: Props) {
  const [data, setData] = useState<DetailData | null>(null)
  const [items, setItems] = useState<({ id: string } & DetailData)[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const rightRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [snapshotExists, setSnapshotExists] = useState<boolean | null>(null)
  const wheelBlockRef = React.useRef<number>(0) // デバウンス用タイムスタンプ
  const DEBOUNCE_MS = 500
  const FADE_MS = 180
  const [isFading, setIsFading] = useState(false)
  const isFadingRef = useRef(false)
  useEffect(() => { isFadingRef.current = isFading }, [isFading])

  const itemsRef = useRef(items)
  const currentIndexRef = useRef(currentIndex)
  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])

  const getParentLabelFromId = (rawId: string) => {
    const m = rawId.match(/^R(\d+)C(\d+)/i)
    if (!m) return rawId
    const r = Number(m[1])
    const c = Number(m[2])
    const rowLabel = ROW_LABELS[r - 1] ?? `R${r}`
    const colLabel = COL_LABELS[c - 1] ?? `C${c}`
    return `${rowLabel} ／ ${colLabel}`
  }

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    let mounted = true

    const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

    const fetchCategoryItems = async (parentRaw: string) => {
      const m = parentRaw.match(/^R0?(\d+)C0?(\d+)/i)
      const parentRow = m ? Number(m[1]) : null
      const parentCol = m ? Number(m[2]) : null
      const results: ({ id: string } & DetailData)[] = []

      for (let rr = 1; rr <= 4; rr++) {
        for (let cc = 1; cc <= 4; cc++) {
          const candidates = new Set<string>()
          candidates.add(`${parentRaw}-r${rr}c${cc}`)
          candidates.add(`${parentRaw}-r0${rr}c0${cc}`)
          if (parentRow !== null && parentCol !== null) {
            candidates.add(`R${pad2(parentRow)}C${pad2(parentCol)}-r${rr}c${cc}`)
            candidates.add(`R${pad2(parentRow)}C${pad2(parentCol)}-r0${rr}c0${cc}`)
          }

          let found: { id: string } & DetailData | null = null
          for (const cand of candidates) {
            try {
              const snap = await getDoc(doc(db, 'details', cand))
              if (snap.exists()) {
                const d = snap.data() as DetailData
                found = { id: cand, ...d }
                break
              }
            } catch {
              //
            }
          }

          if (found) results.push(found)
        }
      }
      return results
    }

    const fetchData = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        setErrorMessage(null)

        const prefix = id.split('-')[0] ?? id
        const isParentPattern = /^R0?\d+C0?\d+$/i.test(prefix) && id.indexOf('-r') === -1

        if (isParentPattern) {
          const list = await fetchCategoryItems(prefix)
          if (!mounted) return
          const filteredList = (list ?? []).filter(it => it.imageUrl && it.imageUrl !== 'no_URL')
          if (!filteredList || filteredList.length === 0) {
            setItems([])
            setCurrentIndex(0)
            setNotFound(true)
            setData(null)
            setSnapshotExists(false)
          } else {
            setItems(filteredList)
            setCurrentIndex(0)
            setData(filteredList[0] ?? null)
            setNotFound(false)
            setSnapshotExists(true)
          }
        } else {
          const ref = doc(db, 'details', id)
          const snap = await getDoc(ref)
          console.log('[DetailPage] fetch id=', id, 'exists=', snap.exists(), 'data=', snap.exists() ? snap.data() : null)
          if (!mounted) return
          if (snap.exists()) {
            const d = snap.data() as DetailData
            const parentPrefix = id.split('-')[0] ?? id
            const list = await fetchCategoryItems(parentPrefix)
            if (!mounted) return
            const filteredList = (list ?? []).filter(it => it.imageUrl && it.imageUrl !== 'no_URL')
            if (filteredList && filteredList.length > 0) {
              const suffix = id.includes('-') ? id.split('-').slice(1).join('-') : ''
              const idx = filteredList.findIndex(it => it.id === id || (suffix && it.id.endsWith(suffix)))
              const useIndex = idx >= 0 ? idx : 0
              setItems(filteredList)
              setCurrentIndex(useIndex)
              setData(filteredList[useIndex] ?? d)
            } else {
              if (d.imageUrl && d.imageUrl !== 'no_URL') {
                setItems([{ id, ...d }])
                setCurrentIndex(0)
                setData(d)
              } else {
                setItems([])
                setCurrentIndex(0)
                setData(null)
                setNotFound(true)
              }
            }
            setNotFound(false)
            setSnapshotExists(true)
          } else {
            setData(null)
            setItems([])
            setNotFound(true)
            setSnapshotExists(false)
          }
        }
      } catch (err) {
        console.error('Error fetching detail:', err)
        const e = err as Error | null
        setErrorMessage(e?.message ?? String(err))
        setData(null)
        setItems([])
        setNotFound(true)
        setSnapshotExists(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [id])

  useEffect(() => {
    const canScrollVertically = (el: HTMLElement | null, delta: number) => {
      if (!el) return false
      return delta > 0
        ? el.scrollTop + el.clientHeight < el.scrollHeight - 1
        : el.scrollTop > 0
    }

    const wheelHandler = (ev: WheelEvent) => {
      const delta = ev.deltaY
      const desc = document.querySelector('.detail-description') as HTMLElement | null

      if (desc && canScrollVertically(desc, delta)) {
        desc.scrollTop += delta
        ev.preventDefault()
        return
      }

      if (!itemsRef.current || itemsRef.current.length === 0) return
      const now = Date.now()
      if (now - wheelBlockRef.current < DEBOUNCE_MS) {
        ev.preventDefault()
        return
      }
      if (Math.abs(delta) < 20) return
      wheelBlockRef.current = now

      if (isFadingRef.current) {
        ev.preventDefault()
        return
      }
      const doIndexChange = (nextIndex: number) => {
        isFadingRef.current = true
        setIsFading(true)
        wheelBlockRef.current = Date.now() + DEBOUNCE_MS + FADE_MS * 2
        setTimeout(() => {
          setCurrentIndex(nextIndex)
          setTimeout(() => {
            isFadingRef.current = false
            setIsFading(false)
          }, FADE_MS)
        }, FADE_MS)
      }

      if (delta > 0) {
        const next = Math.min(itemsRef.current.length - 1, currentIndexRef.current + 1)
        if (next !== currentIndexRef.current) doIndexChange(next)
      } else {
        const next = Math.max(0, currentIndexRef.current - 1)
        if (next !== currentIndexRef.current) doIndexChange(next)
      }
      ev.preventDefault()
    }

    let touchStartYLocal: number | null = null
    const touchStart = (ev: TouchEvent) => { touchStartYLocal = ev.touches[0]?.clientY ?? null }
    const touchMove = (ev: TouchEvent) => {
      if (touchStartYLocal == null) return
      const y = ev.touches[0]?.clientY ?? 0
      const diff = touchStartYLocal - y
      if (Math.abs(diff) < 30) return

      const desc = document.querySelector('.detail-description') as HTMLElement | null
      if (desc && canScrollVertically(desc, diff)) {
        desc.scrollTop += diff
        ev.preventDefault()
        return
      }

      const now = Date.now()
      if (now - wheelBlockRef.current < DEBOUNCE_MS) { ev.preventDefault(); return }
      wheelBlockRef.current = now
      if (isFadingRef.current) { ev.preventDefault(); return }
      const doTouchIndexChange = (nextIndex: number) => {
        isFadingRef.current = true
        setIsFading(true)
        wheelBlockRef.current = Date.now() + DEBOUNCE_MS + FADE_MS * 2
        setTimeout(() => {
          setCurrentIndex(nextIndex)
          setTimeout(() => {
            isFadingRef.current = false
            setIsFading(false)
          }, FADE_MS)
        }, FADE_MS)
      }
      if (diff > 0) {
        const next = Math.min(itemsRef.current.length - 1, currentIndexRef.current + 1)
        if (next !== currentIndexRef.current) doTouchIndexChange(next)
      } else {
        const next = Math.max(0, currentIndexRef.current - 1)
        if (next !== currentIndexRef.current) doTouchIndexChange(next)
      }
      touchStartYLocal = null
      ev.preventDefault()
    }

    const wheelOptions: AddEventListenerOptions = { passive: false }
    const touchMoveOptions: AddEventListenerOptions = { passive: false }
    document.addEventListener('wheel', wheelHandler, wheelOptions)
    document.addEventListener('touchstart', touchStart, { passive: true })
    document.addEventListener('touchmove', touchMove, touchMoveOptions)

    return () => {
      document.removeEventListener('wheel', wheelHandler, wheelOptions)
      document.removeEventListener('touchstart', touchStart as EventListener)
      document.removeEventListener('touchmove', touchMove as EventListener)
    }
  }, []) // handlers read latest via refs

  return (
    <div className="detail-container">
      <div className={`fade-overlay ${isFading ? 'active' : ''}`} />
       {loading ? (
         <p>読み込み中…</p>
       ) : notFound ? (
         <div>
           <p>データが見つかりませんでした（Firestore の 'details' コレクションにドキュメント {id} があるか確認してください）。</p>
           <details style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
             <summary>デバッグ情報を表示</summary>
             <div style={{ marginTop: 8 }}>
               <div><strong>snapshot.exists():</strong> {String(snapshotExists)}</div>
               <div style={{ marginTop: 6 }}><strong>error:</strong> {errorMessage ?? 'なし'}</div>
             </div>
           </details>
           <div style={{ marginTop: 12 }}>
             <button
               className="neumorph-btn detail-back-button"
               onClick={onBack}
               aria-label="戻る"
             >
               &larr; 戻る
             </button>
           </div>
         </div>
       ) : (
         <div>
           <div className="detail-main">
             <div className="detail-left">
               <div className="detail-image-wrapper">
                 <img
                   src={items?.[currentIndex]?.imageUrl ?? data?.imageUrl ?? ''}
                   alt={items?.[currentIndex]?.title ?? data?.title ?? '作品画像'}
                   className="detail-image"
                 />
               </div>
             </div>

             <div
               className="detail-right"
               ref={rightRef}
             >
                <div
                  className="detail-right-inner"
                >
                  {items && items.length > 0 ? (
                    (() => {
                      const it = items[currentIndex]
                      return (
                        <section key={it.id} style={{ marginBottom: 28 }}>
                          <p className="detail-category">カテゴリ：{getParentLabelFromId(it.id)}</p>
                          <h3 className="detail-title">{it.title ?? '無題'}</h3>
                          <div className="detail-meta">{it.author ?? '作者不詳'} ({it.year ?? '不明'}年)</div>
                          <div className="detail-description">
                            {it.description ?? '説明はありません。'}<br /><br /><br /><br /><br /><br /><br /><br />
                          </div>
                      </section>
                    )
                  })()
                ) : data ? (
                   <div>
                     <p className="detail-category">カテゴリ：{getParentLabelFromId(id)}</p>
                     <h3 className="detail-title">{data.title ?? '無題'}</h3>
                     <div className="detail-meta">{data.author ?? '作者不詳'} ({data.year ?? '不明'}年)</div>
                     <div className="detail-description">
                       {data.description ?? '説明はありません。'}
                     </div>
                   </div>
                 ) : null}

                 <div className="detail-back-wrap">
                   <button
                     className="neumorph-btn detail-back-button"
                     onClick={onBack}
                     aria-label="戻る"
                   >
                     &larr; 戻る
                   </button>
                 </div>
               </div>
             </div>

           </div>
         </div>
       )}
     </div>
   )
}
