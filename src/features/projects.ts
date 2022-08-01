import { state } from  '../utils/state'

export interface Project {
  id: string
  name: string
}

const getFigmaCurrentProject = () => {
  return new Promise((resolve, reject) => {
    onmessage = ({ data }) => {
      if (data.pluginMessage && data.pluginMessage.type === 'getCurrentProject') {
        resolve(data.pluginMessage.value)
      }
    }
    parent.postMessage({
      pluginMessage: { type: 'getCurrentProject' },
    }, '*')
  })
}

const getProjects = async () => {
  const url = `https://api.geenes.app/.netlify/functions/getProjects`
  const response = await (await fetch(url, {
    method: 'POST',
    headers: { 
      Authorization: `${state.accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({use_refresh_token: true})
  })).json()
  return response
}
export const calculateLastSynch = async () => {
  if (!state.currentProject) return null
  const lastSynchDates = await getLastSynch()
  let current = lastSynchDates.length ? lastSynchDates.find(data => data.id === state.currentProject.id) : false
  return current? current.lastSynch : false
}

const getLastSynch = (): Promise<Array<any>> => {
  return new Promise((resolve, reject) => {
    onmessage = ({ data }) => {
      if (data.pluginMessage && data.pluginMessage.type === 'getLastSynch') {
        resolve(data.pluginMessage.value)
      }
    }
    parent.postMessage({
      pluginMessage: { type: 'getLastSynch' },
    }, '*')
  })
}

export const fetchProjects = async () => {
  console.log('fetching')
  state.loading = true
  try {
    const { projects } = await getProjects()
    if (projects && projects.length) {
      console.log(projects)
      state.projects = projects
      const figmaCurrentProject = await getFigmaCurrentProject()
      const existingProjectIndex = projects.findIndex((data: Project) => data.id === figmaCurrentProject)
      // if no current project can be found fall back on the first one
      // this can be because the project doesn't exist on geenes anymore or a current project was never set
      state.currentProject = existingProjectIndex < 0 ? projects[0] : projects[existingProjectIndex]
    } else {
      console.warn('no projects available')
    }
    console.log('finished to fetch')
    state.loading = false
  } catch (error) {
    console.error(error)
    state.accessToken = null
    state.showExpiredMessage = true
    console.log('finished to fetch')
    state.loading = false
  }
}