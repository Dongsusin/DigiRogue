import { getCommunityAuth } from '../community/firebaseCommunity.js'
import { firebaseApp } from '../auth/firebaseClient.js'
import { createHallClient } from './hallClient.js'

const emulator = import.meta.env.DEV && import.meta.env.VITE_COMMUNITY_EMULATOR === 'true'
export async function createFirebaseHall(identity) {
  if (!identity) throw new Error('로그인 후 사용할 수 있습니다.')
  if (import.meta.env.DEV && !emulator) throw new Error('개발 서버의 기록은 공용 순위에 등록하지 않습니다.')
  const auth = await getCommunityAuth(identity)
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('로그인 연결을 확인해 주세요.')
  const baseUrl = emulator ? 'http://127.0.0.1:9000' : firebaseApp.options.databaseURL
  const fetchImpl = emulator ? (url, options) => fetch(url + '&ns=demo-digirouge-default-rtdb', options) : globalThis.fetch
  const client = createHallClient({ baseUrl, uid, fetchImpl, getToken: async () => {
    if (auth.currentUser?.uid !== uid) throw new Error('로그인 계정이 변경됐습니다.')
    return auth.currentUser.getIdToken()
  } })
  return { uid, list: client.list, submit: record => {
    if (identity.isAnonymous || auth.currentUser?.isAnonymous) throw new Error('Google 로그인 후 클리어 기록을 등록할 수 있습니다.')
    return client.submit(uid, record)
  } }
}
