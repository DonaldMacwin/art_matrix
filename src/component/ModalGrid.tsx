import React from 'react'

type Props = {
  parentCell: { r: number; c: number }
  onClose: () => void
  onSelectDetail: (r: number, c: number) => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
}

const boxStyle: React.CSSProperties = {
  background: '#fff',
  padding: '16px',
  borderRadius: '6px',
  minWidth: '320px',
}

export default function ModalGrid({ parentCell, onClose, onSelectDetail }: Props) {
  const SIZE = 4

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={boxStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>モーダル — 親セル {`(${parentCell.r}, ${parentCell.c})`}</h3>
          <button onClick={onClose}>閉じる</button>
        </div>

        <div style={{ marginTop: '12px' }}>
          <table style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {Array.from({ length: SIZE }, (_, r) => (
                <tr key={r}>
                  {Array.from({ length: SIZE }, (_, c) => (
                    <td key={c} style={{ border: '1px solid #ddd', padding: '6px', width: '56px', height: '56px' }}>
                      <button
                        onClick={() => onSelectDetail(r + 1, c + 1)}
                        style={{ width: '100%', height: '100%' }}
                      >
                        {`${r + 1},${c + 1}`}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
