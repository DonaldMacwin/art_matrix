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

  // 表示中は下層ページのスクロールを無効にする（モーダル効果）
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

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
    <div style={{
      width: '100vw',
      //maxWidth: '1200px',
      height: '100vh',
      //maxHeight: '900px',
      background: '#fff',
      boxSizing: 'border-box',
      padding: '16px',
      //borderRadius: '8px',
      overflow: 'hidden', // 外側はスクロールを持たせない
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    }}>
      
      

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
        <div style={{ }}>
          {/* 全体の高さを埋めるようにして、右カラム内で下部にボタンを固定 */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', height: 'calc(100% - 0px)' }}>
             <div style={{ flex: 1, minWidth: 240, display: 'flex', justifyContent: 'center' }}>
               <div style={{ width: '100%', maxHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                 {data.imageUrl ? (
                   <img
                     src={data.imageUrl}
                     alt={data.title || '作品画像'}
                     style={{
                       maxWidth: '100%',
                       maxHeight: '90vh',
                       width: 'auto',
                       height: 'auto',
                       objectFit: 'contain',
                     }}
                   />
                 ) : null}
               </div>
             </div>
 
            {/* 右カラム：縦方向に並べ、説明領域はスクロール可能、ボタンは下へ押し出す */}
            <div style={{ flex: 1, minWidth: 240, display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px', borderRadius: 6, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div>
                  <p>選択されたマス： <strong>{id}</strong></p>
                  <h3 style={{ marginTop: 0 }}>{data.title ?? 'タイトルなし'}</h3>
                  <div style={{ color: '#555', marginBottom: 8 }}>
                    <strong>作家：</strong>{data.author ?? '不明'} / <strong>年：</strong>{data.year ?? '不明'}
                  </div>
                </div>

                {/* テキスト部をスクロール可能にして高さを可変にする */}
                <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', color: '#333', textAlign: 'left', overflowY: 'auto' }}>
                  {data.description ?? '説明はありません。'}
                </div>

                {/* ボタンを常に右カラムの最下部に配置するために marginTop:auto を利用 */}
                <div style={{ marginTop: 'auto', paddingTop: 12 }}>
                  <button onClick={onBack} style={{ marginBottom: 0 }}>&larr; 戻る</button>
                </div>
              </div>
            </div>
 
           </div>
         </div>
       ) : null}
     </div>
   )
 }
