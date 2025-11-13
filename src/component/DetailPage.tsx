import React, { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

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

  useEffect(() => {
    let mounted = true
    const fetchData = async () => {
      setLoading(true)
      setNotFound(false)
      try {
        console.log('[DetailPage] fetching id=', id)
        setErrorMessage(null)
        const ref = doc(db, 'details', id)
        const snap = await getDoc(ref)
        console.log('[DetailPage] got snapshot:', snap)
        if (!mounted) return
        const exists = snap.exists()
        setSnapshotExists(exists)
        if (exists) {
          const d = snap.data() as DetailData
          console.log('[DetailPage] document data:', d)
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
    <div style={{ padding: '16px' }}>
      <button onClick={onBack} style={{ marginBottom: '12px' }}>&larr; 戻る</button>
      <p>選択されたマス： <strong>{id}</strong></p>

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
        </div>
      ) : data ? (
        <div style={{ marginTop: '12px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: '100%', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {data.imageUrl ? (
                  <img src={data.imageUrl} alt={data.title || '作品画像'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : null}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ border: '1px solid #eee', padding: '12px', borderRadius: 6 }}>
                <h3 style={{ marginTop: 0 }}>{data.title ?? 'タイトルなし'}</h3>
                <div style={{ color: '#555', marginBottom: 8 }}>
                  <strong>作家：</strong>{data.author ?? '不明'} / <strong>年：</strong>{data.year ?? '不明'}
                </div>

                {/*<div style={{ marginBottom: 8 }}>
                  <strong>タグ：</strong>{(data.tags && data.tags.length > 0) ? data.tags.join('、') : 'なし'}
                </div>*/}

                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#333' }}>
                  {data.description ?? '説明はありません。'}
                </div>
              </div>
            </div>

          </div>
        </div>
      ) : null}
    </div>
  )
}
