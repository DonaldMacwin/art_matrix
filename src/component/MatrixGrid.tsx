import React, { useState } from 'react'
import ModalGrid from './ModalGrid'

type Props = {
  onNavigateToDetail: (id: string, goBack?: () => void) => void
}

const ROWS = 18
const COLS = 14

const COL_LABELS = [
  '崇高',
  '華麗',
  '優美',
  '闊達',
  '巧妙趣向',
  '滑稽愉快',
  '軽妙洒脱',
  '枯淡・侘び寂び',
  '懐郷',
  '幽玄',
  '憐憫',
  '侮蔑',
  '悲壮',
  '醜悪',
]

const ROW_LABELS = [
  '平面造形-絵画美術',
  '平面造形-映像美術',
  '平面造形-写真美術',
  '平面造形-文字美術・書道',
  '立体造形-立体美術',
  '立体造形-建築',
  '立体造形-室内装飾',
  '立体造形-被服',
  '立体造形-工芸',
  '文学-文芸',
  '文学-詩歌',
  '文学-文芸',
  '音楽',
  '料理-調理技法',
  '料理-作法',
  '舞台芸術-演舞',
  '舞台芸術-演劇',
  '舞台芸術-演芸',
]

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
  alignItems: 'flex-end', // 下揃え相当
  justifyContent: 'center',
  height: '64px', // 見た目の調整。必要に応じて変更してください
  padding: 0,
  margin: 0,
}
const colHeaderTextStyle: React.CSSProperties & Record<string, string> = {
  // 縦書き（右→左）に設定
  writingMode: 'vertical-rl',
  // 欧数字混在でも視認性を保つ（ブラウザ用非標準プロパティを文字列で許容）
  textOrientation: 'mixed',
  // 改行（<br/>）を効かせるために nowrap をやめる
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

  // モーダル表示中は thead を薄くするスタイルを用意
  const headerStickyWhenModal = modalOpen
    ? { ...stickyHeaderStyle, opacity: 1.0 }
    : stickyHeaderStyle

  return (
    <div>
      {/* ニューモーフィズム用スタイル（簡易） */}
      <style>{`
        .neumorph-btn {
          width: 100%;
          height: 100%;
          border: none;
          border-radius: 10px;
          /* 真っ白な背景にして影だけ残す（ニューモーフィズム風） */
          background: #ffffff;
          box-shadow:
            6px 6px 14px rgba(16, 24, 40, 0.06),
            -6px -6px 14px rgba(255, 255, 255, 0.95),
            inset 1px 1px 0 rgba(255,255,255,0.6);
          color: #243447;
          font-weight: 400;
          cursor: pointer;
          padding: 0;
          outline: none;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, color 120ms ease;
        }
        /* Hover: 背景を青 (#0072D8) にして文字を白に */
        .neumorph-btn:hover {
          transform: translateY(-1px);
          background: #0072D8;
          color: #ffffff;
          box-shadow:
            8px 8px 18px rgba(2, 34, 80, 0.18),
            -8px -8px 18px rgba(255, 255, 255, 0.85),
            inset 1px 1px 0 rgba(255,255,255,0.08);
        }
        .neumorph-btn:active {
          transform: translateY(1px);
          background: #005bb5;
          color: #ffffff;
          box-shadow:
            inset 6px 6px 12px rgba(8,24,48,0.08),
            inset -6px -6px 12px rgba(255,255,255,0.7);
        }
        .neumorph-btn:focus {
          box-shadow: 0 0 0 3px rgba(0,114,216,0.18);
        }
      `}</style>

      <p>18行 x 14列 のマス目（行/列見出し付き）。各マスのボタンでモーダルを開きます。</p>

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
      <p>18行 x 14列 のマス目（行/列見出し付き）。各マスのボタンでモーダルを開きます。</p>

    </div>
  )
}
