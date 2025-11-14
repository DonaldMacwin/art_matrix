import React, { useState } from 'react'
import './css/App.css'
import MatrixGrid from './component/MatrixGrid'
import DetailPage from './component/DetailPage'

export default function App() {
  // currentDetail に id と goBack を保持する
  const [currentDetail, setCurrentDetail] = useState<{ id: string | null; goBack?: () => void }>({ id: null })

  return (
    <div>
      {/* MatrixGrid を常にマウントする */}
      <MatrixGrid
        onNavigateToDetail={(id, goBack) => {
          // MatrixGrid から詳細要求が来たら、id と goBack を保持して DetailPage を表示
          setCurrentDetail({ id, goBack })
        }}
      />

      {/* 詳細が選択されていたら DetailPage をオーバーレイ表示する */}
      {currentDetail.id && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, background: 'rgba(255,255,255,0.95)' }}>
          <DetailPage
            id={currentDetail.id}
            onBack={() => {
              // DetailPage の「戻る」押下時：まず goBack を呼んでモーダルを再表示、その後詳細状態をクリア
              try { currentDetail.goBack?.() } finally { setCurrentDetail({ id: null }) }
            }}
          />
        </div>
      )}
    </div>
  )
}

