import React, { useState } from 'react'
import ModalGrid from './ModalGrid'
import { ROW_LABELS, COL_LABELS } from '../common/labels'
// 追加: Firestore を読み、r1c1 が no_URL かどうかを判定
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

type Props = {
  onNavigateToDetail: (id: string, goBack?: () => void) => void
}

const ROWS = 17
const COLS = 14

const headerStyle: React.CSSProperties = {
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

const colHeaderInnerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-end',
  justifyContent: 'center',
  height: '4em',
  padding: 0,
  margin: 0,
}
const colHeaderTextStyle: React.CSSProperties & Record<string, string> = {
  writingMode: 'vertical-rl',
  textOrientation: 'mixed',
  whiteSpace: 'normal',
  lineHeight: '1',
  padding: '0 4px',
}

const cellStyle: React.CSSProperties = {
  padding: '4px',
  width: '48px',
  height: '48px',
  textAlign: 'center',
}

export default function MatrixGrid({ onNavigateToDetail }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [activeCell, setActiveCell] = useState<{ r: number; c: number } | null>(null)
  const [hoveredCell, setHoveredCell] = useState<{ r: number; c: number } | null>(null)

  // 親セルごとに r1c1 の imageUrl が "no_URL" かを保持するマップ
  const [disabledParents, setDisabledParents] = useState<Record<string, boolean>>({})

  React.useEffect(() => {
    let mounted = true
    const load = async () => {
      const next: Record<string, boolean> = {}
      const promises: Promise<void>[] = []
      for (let r = 1; r <= ROWS; r++) {
        for (let c = 1; c <= COLS; c++) {
          const key = `${r}-${c}`
          const id = `R${r}C${c}-r1c1`
          promises.push((async () => {
            try {
              const snap = await getDoc(doc(db, 'details', id))
              if (snap.exists()) {
                const d = snap.data() as { imageUrl?: string }
                next[key] = (d.imageUrl === 'no_URL')
              } else {
                // ドキュメントがない場合は無効扱いにする（必要なら true/false を調整）
                next[key] = true
              }
            } catch {
              next[key] = true
            }
          })())
        }
      }
      await Promise.all(promises)
      if (mounted) setDisabledParents(next)
    }
    load()
    return () => { mounted = false }
  }, [])

  function openModal(r: number, c: number) {
    setActiveCell({ r, c })
    setModalOpen(true)
  }

  const headerStickyWhenModal = modalOpen
    ? { ...stickyHeaderStyle, opacity: 1.0 }
    : stickyHeaderStyle

  return (
    <div>
      <p>藝術たしなみマトリックス</p>

      <div style={{ overflow: 'auto', maxHeight: '65vh' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerStickyWhenModal}></th>
              {Array.from({ length: COLS }, (_, ci) => {
                const isColHovered = hoveredCell && hoveredCell.c === ci + 1
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
                <th style={{ ...rowHeaderStyle, ...(hoveredCell && hoveredCell.r === ri + 1 ? { background: '#BDDCF4' } : {}) }}>
                  {ROW_LABELS[ri] ?? `R${ri + 1}`}
                </th>
                {Array.from({ length: COLS }, (_, ci) => (
                  (() => {
                    const isHighlighted = hoveredCell && (hoveredCell.r === ri + 1 || hoveredCell.c === ci + 1)
                    // disabled ボタン自身は hover で hoveredCell をセットしないので、ここでは行/列ハイライトは常に適用する
                    const parentKey = `${ri + 1}-${ci + 1}`
                    const parentDisabled = Boolean(disabledParents[parentKey])
                    const tdStyle = { ...cellStyle, ...(isHighlighted ? { background: '#BDDCF4' } : {}) }
                    return (
                      <td key={ci} style={tdStyle}>
                        <button
                          className="neumorph-btn"
                          onClick={() => openModal(ri + 1, ci + 1)}
                          onMouseEnter={() => { if (!parentDisabled) setHoveredCell({ r: ri + 1, c: ci + 1 }) }}
                          onMouseLeave={() => setHoveredCell(null)}
                          aria-label={`セル ${ri + 1} 行 ${ci + 1} 列`}
                          disabled={parentDisabled}
                          aria-disabled={parentDisabled}
                          /* style を削除: 見た目は CSS 側で統一し、pointer-events は CSS で無効化済み */
                          style={parentDisabled ? { cursor: 'default' } : undefined}
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
      <div style={{ maxWidth: '50vw', margin: '3em auto 9em auto', textAlign: 'left', padding: '0 8px', lineHeight: '2.0' }}>
        <p className='guide-text'>
          「この程度を知っていれば、無教養と小馬鹿にはされない」レベルの芸術を一覧で俯瞰できる目録ページが、この藝術たしなみマトリックスだ。<br />17種の表現技法フィールド行と14種の美的感情喚起列の区分を準備した。ぜひ全ジャンルをたしなんでいただきたい。<br />
          「私よく知るXXXXがない！」とご批評ご不満の向きもあるだろう。<br /><br /><br /></p>
        <p className='guide-text'>
          ・論理性や客観性を求められない。学問としては最も論理性に劣っている。
          ・散漫で学術的には最も遅れている。せいぜいカタログ目録的な分類ていどしか実在していない。
          ・感情に訴える表現技法
          ・1ジャンルを形成しているものの、境界は曖昧で、政治経済／社会／歴史／哲学宗教の諸学問から逸脱疎外されしがちだった技術者たちが長い年月をかけ築き上げて来たジャンルだ。
          ・経済的には興行活動と資産運用商品。
          ・芸術家の殆どは「美術史に名を残す」ことを目指しているだけの下世話な人々。
          ・芸術大学のそもそもの発端が「工芸品の製造技術者を養成するための学校」だった。
        </p>
        <h2 className='guide-text'>これから深めてゆきたいかたのために</h2>
        <p className='guide-text'>現2020年代時点では以下の別12フィールドへ飛び込むことを奨めたい。それぞれのフィールドでどのような学究が進められているかを簡単に紹介した学術俯瞰サイト『13個のゼリー』<a href="https://cf268321.cloudfree.jp/13jellies/" target="_blank" rel="noopener noreferrer">https://cf268321.cloudfree.jp/13jellies/ </a>も用意した。<br /><br />
          言語／哲学／数学／化学／物理<br />
          時空間（地理／歴史／天文／気象／地学）<br />
          社会／医学／生物<br />
          政治経済／産業技術</p>
        <a href="https://cf268321.cloudfree.jp/13jellies/" target="_blank" rel="noopener noreferrer"><img src="https://cf268321.cloudfree.jp/13jellies/asset/img/13jellies_A.png" alt="" className='guide-text' /></a>
        <p className='guide-text'>あなたのこれからに、より深くより広い視野がもたらされますよう。</p>
      </div>
    </div>
  )
}
