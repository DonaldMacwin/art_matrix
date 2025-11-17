import React from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export default function SeedTest() {
  const createTestDoc = async () => {
    try {
      await setDoc(doc(db, 'details', 'R1C1-r0c0'), {
        title: 'テスト作品',
        author: 'テスト作家',
        year: '2025',
        description: 'これはテストデータです（クライアントから登録）',
      })
      alert('ドキュメントを作成しました: R1C1-r0c0')
    } catch (err) {
      console.error(err)
      alert('作成に失敗しました（コンソール参照）')
    }
  }

  return <button onClick={createTestDoc}>テストデータを追加（details/R1C1-r0c0）</button>
}