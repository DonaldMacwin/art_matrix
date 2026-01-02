import React, { useState } from 'react'
import ModalGrid from './ModalGrid'
import { ROW_LABELS, COL_LABELS } from '../common/labels'
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
    <div style={{ maxWidth:'920px' }}>
      <h1><img src="./dist/logo_art_matrix.svg" alt="藝術たしなみマトリクス" /></h1>

      <div style={{ overflow: 'auto', maxHeight: '65vh', margin: '0 auto' }}>
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
      <div style={{ margin: '3em auto 9em auto'}}>
        <p className='guide-text'>
          「この程度を知っていれば、無教養と小馬鹿にはされない」クラスの芸術を一覧で俯瞰できる目録ページが、この藝術たしなみマトリクスだ。<br />17種の表現技法フィールド行と14種の美的感情を喚起する列の区分を準備した。さあ！全ジャンルをたしなみ、インスタント教養人を目指そう。訳知り顔で教養人気取りにぜひ振舞っていただきたい。<br />
          かたや「私のよく知るXXXXがない！」とご批評ご不満の向きもあるだろう。あなたが知るXXXXがとてもマニアックかローカルな選択なのか、このページにまだ抜け漏れがあるのかのいずれかだろう。<br /></p>
        <br />
        <h2 className='guide-text'>芸術は最も学術化の遅れる保守分野</h2>
        <p className='guide-text'>
          芸術は感情へ訴える表現技法アプローチにのみ主軸を据えた、稀有な体系である。体系化はじつに散漫で、せいぜいカタログ目録的な分類ていどしか定義できていない。<br />
          一応半ば哲学と化している範疇内に「美学」というジャンルは存在するが論理体系として雑駁で抜け漏れも多く、客観性よりも固有主観の感情喚起に訴え、芸術は最も論理構築性・網羅性一般化に劣る保守的な分野である。<br />
          芸術には共有されている基本理論体系もなく応用理論も皆無だ。<br />
          工学技術がどんどん一般化汎用化を進め産業へ取り込まれ普及する変遷を辿ったのとは、対照的である。<br />
        </p>
        <br />
        <h2 className='guide-text'>芸術家誕生の経緯</h2>
        <p className='guide-text'>
          英語の"artist"がかつては技芸を持つ者・工職人の意味であったことからもうかがえるように、近世以前に技術者と芸術家に大した区分はなかった。<br />
          技術者(engineer)と芸術家(artist)に職種が分かれたのは近世の産業革命以降である。100年ほど遅れ日本でもそのニュアンスのまま輸入されており、現東京芸術大学の前身は「工芸産業品の製造技術者を養成するための学校」だった。<br />
          その後技術者は科学知識と結びつき「工学」として分化、大資本の産業技術分野へと発展し、大量生産大量消費社会化へと呑み込まれてゆく。<br />
          かたや取り残された芸術家は純粋数学や哲学理念の美しさを愛でないまま、美術史に名を残すことを目指す人々として、興行収入と資産運用商品製造へと収斂してしまう。<br />
          芸術家は応用数学や哲学の孫引きはするが、純粋数学や哲学理念の美しさは愛でない。また政治経済／社会／歴史／哲学宗教の諸学問から逸脱疎外してしまう気質の者が居残る分野として、芸術は今日に至る。<br />
        </p>
        <br />
        <h2 className='guide-text'>これからさらに深めてゆきたいかたのために</h2>
        <p className='guide-text'>現2020年代時点では以下の別12フィールドへ飛び込むことを奨めたい。どこにも属せなかった芸術家たちのフィールドがどのようなものか比較してみるのも一興だろう。それぞれのフィールドでどのような学究が進められているかを簡単に紹介した学術俯瞰サイト『13個のゼリー』<a href="https://cf268321.cloudfree.jp/13jellies/" target="_blank" rel="noopener noreferrer">https://cf268321.cloudfree.jp/13jellies/ </a>も用意した。<br /><br />
          言語／哲学宗教／数／化学／物理<br />
          時空間（地理／歴史／天文／気象／地学）<br />
          社会／医学／生物<br />
          政治経済／産業技術</p>
        <a href="https://cf268321.cloudfree.jp/13jellies/"><img src="https://cf268321.cloudfree.jp/13jellies/asset/img/13jellies_A.png" alt="" className='guide-text' /></a>
        <p className='guide-text'>あなたのこれからに、より深くより広い視野がもたらされますよう。</p>
      </div>
    </div>
  )
}
