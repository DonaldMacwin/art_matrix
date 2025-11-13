import React, { useState } from 'react'
import ModalGrid from './ModalGrid'

type Props = {
  onNavigateToDetail: (id: string) => void
}

const ROWS = 18
const COLS = 14

const headerStyle: React.CSSProperties = {
  background: '#f0f0f0',
  fontWeight: '600',
  padding: '6px',
  textAlign: 'center',
}

const cellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: '4px',
  width: '48px',
  height: '48px',
  textAlign: 'center',
}

export default function MatrixGrid({ onNavigateToDetail }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null)

  function openModal(r: number, c: number) {
    setActiveCell({ r, c })
    setModalOpen(true)
  }

  return (
    <div>
      <p>18行 x 14列 のマス目（行/列見出し付き）。各マスのボタンでモーダルを開きます。</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStyle}></th>
              {Array.from({ length: COLS }, (_, ci) => (
                <th key={ci} style={headerStyle}>{`C${ci + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, ri) => (
              <tr key={ri}>
                <th style={headerStyle}>{`R${ri + 1}`}</th>
                {Array.from({ length: COLS }, (_, ci) => (
                  <td key={ci} style={cellStyle}>
                    <button
                      onClick={() => openModal(ri + 1, ci + 1)}
                      style={{ width: '100%', height: '100%' }}
                    >
                      {`(${ri + 1},${ci + 1})`}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && activeCell && (
        <ModalGrid
          parentCell={activeCell}
          onClose={() => setModalOpen(false)}
          onSelectDetail={(subR, subC) => {
            const id = `R${activeCell.r}C${activeCell.c}-r${subR}c${subC}`
            setModalOpen(false)
            onNavigateToDetail(id)
          }}
        />
      )}
    </div>
  )
}
