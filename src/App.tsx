import React, { useState } from 'react'
import './css/App.css'
import MatrixGrid from './component/MatrixGrid'
import DetailPage from './component/DetailPage'

function App() {
  // detailId is null => show main matrix. If set, show DetailPage component.
  const [detailId, setDetailId] = useState<string | null>(null)

  return (
    <div className="app-root">
      <header>
      </header>

      {detailId ? (
        <DetailPage id={detailId} onBack={() => setDetailId(null)} />
      ) : (
        <MatrixGrid onNavigateToDetail={(id) => setDetailId(id)} />
      )}
    </div>
  )
}

export default App
