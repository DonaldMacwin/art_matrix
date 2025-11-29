import React, { useState } from 'react'
import ModalGrid from './ModalGrid'
import { ROW_LABELS, COL_LABELS } from '../common/labels'

type Props = {
  onNavigateToDetail: (id: string, goBack?: () => void) => void
}

const ROWS = 17
const COLS = 14

const headerStyle: React.CSSProperties = {
  //background: '#f0f0f0',
  fontWeight: '600',
  padding: '6px',
  textAlign: 'center',
}

const rowHeaderStyle: React.CSSProperties = {
  ...headerStyle,
  textAlign: 'right',
}

const stickyHeaderStyle: React.CSSProperties = {
  ...headerStyle,
  position: 'sticky',
  top: 0,
  zIndex: +1,
  background: '#fff',
}

// 1行目見出しの縦書きテキスト用スタイル（下揃えに見せるために th 内で flex コンテナを使う）
const colHeaderInnerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  height: '4em',
  padding: 0,
  margin: 0,
}
const colHeaderTextStyle: React.CSSProperties & Record<string, string> = {
  // 縦書き（右→左）に設定
  writingMode: 'vertical-rl',
  // 欧数字混在でも視認性を保つ（ブラウザ用非標準プロパティを文字列で許容）
  textOrientation: 'mixed',
  whiteSpace: 'normal',
  lineHeight: '1',
  padding: '0 4px',
}

const cellStyle: React.CSSProperties = {
  //border: '1px solid #ddd',
  padding: '4px',
  width: '48px',
  height: '48px',
  textAlign: 'center',
}

export default function MatrixGrid({ onNavigateToDetail }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null)
  // ホバー中のセル位置を保持（1-indexed）
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null)

  function openModal(r: number, c: number) {
    setActiveCell({ r, c })
    setModalOpen(true)
  }

  // モーダル表示中は thead を薄くするスタイル
  const headerStickyWhenModal = modalOpen
    ? { ...stickyHeaderStyle, opacity: 1.0 }
    : stickyHeaderStyle

  return (
    <div>
      <p>芸術たしなみ図鑑</p>

      <div style={{ overflow: 'auto', maxHeight: '85vh' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStickyWhenModal}></th>
              {Array.from({ length: COLS }, (_, ci) => {
                // 列ヘッダもホバー時に薄グレーを付ける
                const isColHovered = hoveredCell && hoveredCell.c === ci + 1
                // Hover 色を #BDDCF4 に変更
                const thStyle = { ...headerStickyWhenModal, ...(isColHovered ? { background: '#BDDCF4' } : {}) }
                return (
                  <th key={ci} style={thStyle}>
                    <div style={colHeaderInnerStyle}>
                      <span style={colHeaderTextStyle}>
                        {ci === 7 ? (
                          <>
                            {'枯淡・'}
                            <br />
                            {'侘び寂び'}
                          </>
                        ) : (
                          COL_LABELS[ci] ?? `C${ci + 1}`
                        )}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROWS }, (_, ri) => (
              <tr key={ri}>
                {/* 行ヘッダもホバー時に薄グレーを付ける */}
                <th style={{ ...rowHeaderStyle, ...(hoveredCell && hoveredCell.r === ri + 1 ? { background: '#BDDCF4' } : {}) }}>
                  {ROW_LABELS[ri] ?? `R${ri + 1}`}
                </th>
                {Array.from({ length: COLS }, (_, ci) => (
                  (() => {
                    const isHighlighted = hoveredCell && (hoveredCell.r === ri + 1 || hoveredCell.c === ci + 1)
                    // セルの強調色も #BDDCF4 に変更
                    const tdStyle = { ...cellStyle, ...(isHighlighted ? { background: '#BDDCF4' } : {}) }
                    return (
                      <td key={ci} style={tdStyle}>
                        <button
                          className="neumorph-btn"
                          onClick={() => openModal(ri + 1, ci + 1)}
                          onMouseEnter={() => setHoveredCell({ r: ri + 1, c: ci + 1 })}
                          onMouseLeave={() => setHoveredCell(null)}
                          aria-label={`セル ${ri + 1} 行 ${ci + 1} 列`}
                        >
                        </button>
                      </td>
                    )
                  })()
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
            const parent = { ...activeCell }
            setModalOpen(false)
            onNavigateToDetail(id, () => {
              setActiveCell(parent)
              setModalOpen(true)
            })
          }}
        />
      )}
      <div style={{ maxWidth: '50vw', margin: '3em auto', textAlign: 'left', padding: '0 8px', lineHeight: '2.0' }}>
        <p style={{ margin: 0 }}>
          芸術とは感情喚起の分野である、とかなんとかここにテキストがはいる。芸術とは感情喚起の分野である、とかなんとかここにテキストがはいる。芸術とは感情喚起の分野である、とかなんとかここにテキストがはいる。芸術とは感情喚起の分野である、とかなんとかここにテキストがはいる。芸術とは感情喚起の分野である、とかなんとかここにテキストがはいる。
          ・論理性や客観性を求められない。
          ・散漫で学術的には最も遅れている。せいぜいカタログ目録的な分類ていどしか実在していない。
          ・感情に訴える表現技法
          ・「私の知ってるXXXXがない！」とご批評ご不満の向きもあるだろう。
        </p>
      </div>
    </div>
  )
}
