import React, { useEffect, useState } from 'react'
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
  // items: 親セル内（最大16件）を行優先で格納
  const [items, setItems] = useState<({ id: string } & DetailData)[]>([])
  // 現在表示している items のインデックス（0〜items.length-1）
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [snapshotExists, setSnapshotExists] = useState<boolean | null>(null)
  const wheelBlockRef = React.useRef<number>(0) // デバウンス用タイムスタンプ
  const touchStartY = React.useRef<number | null>(null)
  const DEBOUNCE_MS = 300

  // id から親セル位置を取得して、行見出し＋列見出しを返す（存在しない場合は id をそのまま返す）
  const getParentLabelFromId = (rawId: string) => {
    const m = rawId.match(/^R(\d+)C(\d+)/i)
    if (!m) return rawId
    const r = Number(m[1])
    const c = Number(m[2])
    const rowLabel = ROW_LABELS[r - 1] ?? `R${r}`
    const colLabel = COL_LABELS[c - 1] ?? `C${c}`
    return `${rowLabel} ／ ${colLabel}`
  }

  // 表示中は下層ページのスクロールを無効にする（モーダル効果）
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // firebaseからデータ取得（単一ドキュメント or 親セルの16件を自動判別）
  useEffect(() => {
    let mounted = true

    const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`)

    const fetchCategoryItems = async (parentRaw: string) => {
      // parentRaw 例: "R1C1" または "R01C01"
      const m = parentRaw.match(/^R0?(\d+)C0?(\d+)/i)
      const parentRow = m ? Number(m[1]) : null
      const parentCol = m ? Number(m[2]) : null
      const results: ({ id: string } & DetailData)[] = []

      for (let rr = 1; rr <= 4; rr++) {
        for (let cc = 1; cc <= 4; cc++) {
          const candidates = new Set<string>()
          // 多形式の候補を作る（ゼロ埋めあり/なし、parent のまま / パッドした parent）
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
              // ignore individual fetch errors
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

        // 親プレフィックスを取得（"R...?C...`
        const prefix = id.split('-')[0] ?? id
        // 判定: 指定 id が親プレフィックスのみ（例: "R1C1"）か、もしくは "R1C1-r1c1" のように "-r" を含むか
        const isParentPattern = /^R0?\d+C0?\d+$/i.test(prefix) && id.indexOf('-r') === -1

        if (isParentPattern) {
          // parent 指定で16件取得 → items に格納、currentIndex=0 にセット
          const list = await fetchCategoryItems(prefix)
          if (!mounted) return
          if (!list || list.length === 0) {
            setItems([])
            setCurrentIndex(0)
            setNotFound(true)
            setData(null)
            setSnapshotExists(false)
          } else {
            setItems(list)
            setCurrentIndex(0)
            setData(list[0] ?? null)
            setNotFound(false)
            setSnapshotExists(true)
          }
        } else {
          // 単一 id（例: "R1C1-r1c1"）の場合、まず try 単体取得、
          // その id の parent をキーにして「同一親の16件連続表示」を有効にするかは要件次第。
          const ref = doc(db, 'details', id)
          const snap = await getDoc(ref)
          console.log('[DetailPage] fetch id=', id, 'exists=', snap.exists(), 'data=', snap.exists() ? snap.data() : null)
          if (!mounted) return
          if (snap.exists()) {
            const d = snap.data() as DetailData
            setData(d)
            setItems([ { id, ...d } ])
            setCurrentIndex(0)
            setNotFound(false)
            setSnapshotExists(true) // 追加: 存在フラグを true に
          } else {
            // 見つからなければ notFound
            setData(null)
            setItems([])
            setNotFound(true)
            setSnapshotExists(false) // 追加: 存在フラグを false に
          }
        }
      } catch (err) {
        console.error('Error fetching detail:', err)
        const e = err as Error | null
        setErrorMessage(e?.message ?? String(err))
        setData(null)
        setItems([])
        setNotFound(true)
        setSnapshotExists(false) // 追加: エラー時は false に
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchData()
    return () => { mounted = false }
  }, [id])

  // --- スクロール／タッチで currentIndex を変更するハンドラ ---
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!items || items.length === 0) return
    const now = Date.now()
    if (now - wheelBlockRef.current < DEBOUNCE_MS) {
      e.preventDefault()
      return
    }
    const delta = (e as React.WheelEvent).deltaY
    if (Math.abs(delta) < 10) return
    wheelBlockRef.current = now
    if (delta > 0) {
      setCurrentIndex((i) => Math.min(items.length - 1, i + 1))
    } else {
      setCurrentIndex((i) => Math.max(0, i - 1))
    }
    e.preventDefault()
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartY.current == null) return
    const y = e.touches[0]?.clientY ?? 0
    const diff = touchStartY.current - y
    if (Math.abs(diff) < 30) return
    const now = Date.now()
    if (now - wheelBlockRef.current < DEBOUNCE_MS) return
    wheelBlockRef.current = now
    if (diff > 0) {
      setCurrentIndex((i) => Math.min(items.length - 1, i + 1))
    } else {
      setCurrentIndex((i) => Math.max(0, i - 1))
    }
    touchStartY.current = null
    e.preventDefault()
  }

  return (
    <div className="detail-container">
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
                {/* 左画像は items または 単一 data の最初を表示 */}
                <img
                  src={items?.[currentIndex]?.imageUrl ?? data?.imageUrl ?? ''}
                  alt={items?.[currentIndex]?.title ?? data?.title ?? '作品画像'}
                  className="detail-image"
                />
              </div>
            </div>

            <div className="detail-right">
              <div
                className="detail-right-inner"
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                {/* items があれば currentIndex のアイテムを1件だけ表示 */}
                {items && items.length > 0 ? (
                  (() => {
                    const it = items[currentIndex]
                    return (
                      <section key={it.id} style={{ marginBottom: 28 }}>
                        <p className="detail-category">カテゴリ：{getParentLabelFromId(it.id)}</p>
                        <h3 className="detail-title">{it.title ?? '無題'}</h3>
                        <div className="detail-meta">{it.author ?? '作者不詳'} ({it.year ?? '不明'}年)</div>
                        <div className="detail-description">
                          {it.description ?? '説明はありません。'}
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
