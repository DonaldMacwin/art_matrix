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
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [snapshotExists, setSnapshotExists] = useState<boolean | null>(null)

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

  // firebaseからデータ取得
  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        setErrorMessage(null)
        const ref = doc(db, 'details', id)
        const snap = await getDoc(ref)
        if (!mounted) return
        const exists = snap.exists()
        setSnapshotExists(exists)
        if (exists) {
          const d = snap.data() as DetailData
          setData(d)
          setNotFound(false)
        } else {
          setData(null)
          setNotFound(true)
        }
      } catch (err) {
        console.error('Error fetching detail:', err)
        const e = err as Error | null
        setErrorMessage(e?.message ?? String(err))
        setData(null)
        setNotFound(true)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchData()
    return () => { mounted = false }
  }, [id])

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
      ) : data ? (
        <div>
          <div className="detail-main">
            <div className="detail-left">
              <div className="detail-image-wrapper">
                {data.imageUrl ? (
                  <img
                    src={data.imageUrl}
                    alt={data.title || '作品画像'}
                    className="detail-image"
                  />
                ) : null}
              </div>
            </div>

            <div className="detail-right">
              <div className="detail-right-inner">
                <div>
                  <p className="detail-category">カテゴリ：{getParentLabelFromId(id)}</p>
                  <h3 className="detail-title">{data.title ?? '無題'}</h3>
                  <div className="detail-meta">
                    {data.author ?? '作者不詳'} ({data.year ?? '不明'}年)
                  </div>
                </div>

                <div className="detail-description">
                  {data.description ?? '説明はありません。'}
                </div>

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
      ) : null}
    </div>
  )
}
