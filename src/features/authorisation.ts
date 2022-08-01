import { state } from  '../utils/state'

const HOST = 'https://geenes-figma.herokuapp.com'

const authenticateAndGetToken = async () => {
  const { read_key, write_key } = await (await fetch(`${HOST}/keys`)).json()
  window.open(`${HOST}/start?write_key=${encodeURIComponent(write_key)}`, '_blank')
  let accessToken
  while (true && state.isAuthorising) {
    console.log('try to get token')
    try {
      const json = await (await fetch(`${HOST}/finish?read_key=${encodeURIComponent(read_key)}`)).json()
      console.log(json)
      if (json.access_token !== null) {
        accessToken = json.access_token
        break
      }
    } catch (e) {
    }
    await new Promise(resolve => setTimeout(resolve, 1000 + 1000 * Math.random()))
  }
  return accessToken
}

const setToken = (value: string | null) => {
  return new Promise((resolve, reject) => {
    onmessage = ({ data }) => {
      if (data.pluginMessage && data.pluginMessage.type === 'setToken') {
        if (data.pluginMessage.success) {
          resolve(true)
        } else {
          reject()
        }
      }
    }
    parent.postMessage({
      pluginMessage: { type: 'setToken', payload: value },
    }, '*')
  })
}

const getToken = () => {
  return new Promise((resolve, reject) => {
    onmessage = ({ data }) => {
      if (data.pluginMessage && data.pluginMessage.type === 'getToken') {
        resolve(data.pluginMessage.value)
      }
    }
    parent.postMessage({
      pluginMessage: { type: 'getToken' },
    }, '*')
  })
}

export const login = async () => {
  state.isAuthorising = true
  state.accessToken = await authenticateAndGetToken()
  await setToken(state.accessToken)
  state.isAuthorising = false
}

export const undoLogin = () => {
  state.accessToken = null
  state.isAuthorising = false
}

export const logout = async () => {
  state.accessToken = null
  await setToken(null)
  state.isAuthorising = false
}

export const checkExistingToken = async () => {
  state.loading = true
  state.accessToken = await getToken()
  if (state.accessToken) {
    console.log('access token set', state.accessToken)
  } else {
    console.log('NO access token')
  }
  state.loading = false

}