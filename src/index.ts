import './style/reset.css'
import './style/style.css'
import './reactivity.css'
import { areArraysEqual, easeOutCubic } from  './utils/functions'
import { login, undoLogin, logout, checkExistingToken } from './features/authorisation'
import { fetchProjects, Project, calculateLastSynch, setCurrentProjectOnFigma } from './features/projects'
import { importColors, preflightColors, importColorsInFigmaTokens } from './features/colors'
import { state } from './utils/state'
import { render, cancel } from 'timeago.js'
import { renderQuote } from './utils/quotes'

import debugCss from './style/debug.css?raw'
if (import.meta.env.MODE === 'development') {
  const styleTag = document.createElement('style')
  styleTag.id = "debug"
  styleTag.innerHTML = debugCss as unknown as string
  document.head.appendChild(styleTag)
}

const forms = document.forms as Forms

// Reactivity controllers
const isAuthorisingCtrl = (state: State, oldState: State) => {
  if (state.isAuthorising === oldState.isAuthorising) return
  console.log('isAuthorisingCtrl')

  forms['main'].elements['is-authorising'].checked = state.isAuthorising
};
const authorisationCtrl = (state: State, oldState: State) => {
  if (state.accessToken === oldState.accessToken) return

  forms['main'].elements['authorised'].checked = !!state.accessToken
  if (state.accessToken) {
    console.log(' fetch projects')
    fetchProjects()
  }
};
const generalLoginCtrl = (state: State, oldState: State) => {
  if (state.loading === oldState.loading) return

  console.log('generalLoginCtrl', state.loading)

  forms['main'].elements['is-loading'].checked = state.loading
  let change = new Event('change');
  forms['main'].elements['is-loading'].dispatchEvent(change);
};
const currentProjectCtrl = async (state: State, oldState: State) => {
  if (state.currentProject === oldState.currentProject) return

  console.log('currentProjectCtrl', state.currentProject)
  if (!state.currentProject) return
  const a =  await setCurrentProjectOnFigma()
  console.log('setCurrentProjectOnFigma', await setCurrentProjectOnFigma())
  forms['main'].elements['projects-list'].value = state.currentProject.id

  const {colorsAmount, updateDate} = state.currentProject
  const counter = document.querySelector('.projects-list [data-field="colors"] .counter')
  counter!.innerHTML = colorsAmount
  // cancel timeago render
  cancel()
  const timeagoNodes: Array<HTMLElement> = []
  const updateDateEl = document.querySelector('.projects-list [data-field="last-update"] ~ dd .timeago') as HTMLElement
  if (updateDateEl) {
    updateDateEl.setAttribute('datetime', new Date(updateDate._seconds * 1000).toLocaleString('en-US'))
    timeagoNodes.push(updateDateEl)
  }
  const importDateEl = document.querySelector('.projects-list [data-field="last-import"] ~ dd .timeago') as HTMLElement
  const lastSynch = await calculateLastSynch()
  if(lastSynch) {
    importDateEl.setAttribute('datetime', new Date(lastSynch).toLocaleString('en-US'))
    timeagoNodes.push(importDateEl)
  } else {
    importDateEl!.innerHTML = 'Never'
  }
  // use render method to render nodes in real time
  render(timeagoNodes, 'en-US')
  const pre = await preflightColors()
  
  const table = document.querySelector('.projects-list .color-list .grid') as HTMLElement
  const changesCounter = document.querySelector('.projects-list .color-list summary span') as HTMLElement
  table.innerHTML = ''
  changesCounter.innerHTML = pre.length.toString()
  pre.forEach(col => {
    const rowTemplate = 
    ((
      document.getElementById('preflight-color-row') as HTMLTemplateElement)!
      .content.cloneNode(true) as DocumentFragment)
      .firstElementChild;
      

      const colorEl = rowTemplate!.querySelector('.icon-preflight') as HTMLElement;
      colorEl!.setAttribute('data-action', col.action)
      let color = 'red'
      if (col.action === 'create') {
        const { r,g,b } = col.value.new
        color = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
      } else if (col.action === 'delete') {
        const { r,g,b } = col.value.old
        color = `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`
      } else if (col.action === 'update') {
        const { r : rold, g: gold, b: bold } = col.value.old
        const { r: rnew, g: gnew ,b: bnew } = col.value.new
        color = `linear-gradient(135deg,
          rgb(${Math.round(rold * 255)},${Math.round(gold * 255)},${Math.round(bold * 255)}) 49%,
          white 49% 51%,
          rgb(${Math.round(rnew * 255)},${Math.round(gnew * 255)},${Math.round(bnew * 255)}) 51%
          )`
      }
      console.log(color)
      colorEl!.style.background = color
      table.appendChild(rowTemplate!)
  })

};

const fetchingProjectsCtrl = async (state: State, oldState: State) => {
  if (areArraysEqual(state.projects, oldState.projects)) return
  console.log('fetchingProjectsCtrl')
  
  forms['main'].elements['projects-list'].innerHTML = 
  state.projects
  .map(({ name, id } : Partial<Project>) => `<option value="${id}">${name}</option>`)
  .join(' ')
  forms['main'].elements['number-projects'].setAttribute('value', state.projects.length)
};

// Subscribe the render function to state changes
window.subscribers.push(isAuthorisingCtrl);
window.subscribers.push(authorisationCtrl);
window.subscribers.push(generalLoginCtrl);
window.subscribers.push(fetchingProjectsCtrl);
window.subscribers.push(currentProjectCtrl);



// UI elements events
forms['main'].elements['login'].onclick = () => forms['main'].onsubmit = (e: Event) => { 
  e.preventDefault()
  login()
}

forms['main'].elements['undo-login'].onclick = () => forms['main'].onsubmit = (e: Event) => { 
  e.preventDefault()
  undoLogin()
}

forms['main'].elements['logout'].onclick = () => forms['main'].onsubmit = (e: Event) => { 
  e.preventDefault()
  logout()
}

window.onload = () => {
  // state.loading = true
  // body is hidden to avoid weird flicker effects
  document.body.removeAttribute('hidden')
  checkExistingToken()
}

forms['main'].elements['projects-list'].onchange = () => { 
  const obj = Object.fromEntries(new FormData(forms['main']) as any)
  state.currentProject = state.projects.find(({id} : Partial<Project>) => id === obj['selected-project'])
}

forms['main'].elements['import'].onclick = () => forms['main'].onsubmit = (e: Event) => { 
  e.preventDefault()
  importColors()
  fetchProjects()
}

forms['main'].elements['refresh'].onclick = () => forms['main'].onsubmit = (e: Event) => { 
  e.preventDefault()
  fetchProjects()
}
forms['main'].elements['number-projects'].onchange = () => {
  forms['main'].elements['number-projects'].setAttribute('value', forms['main'].elements['number-projects'].value)
}
// Loading part

forms['main'].elements['is-loading'].onchange = () => { 
  const loaderMsg = document.querySelector('.loader-msg')
  loaderMsg!.innerHTML = renderQuote();
  clearProgress()
  startProgress()
}

const progress = forms['main'].querySelector('progress')
let progressInterval: NodeJS.Timer

const clearProgress = () => clearInterval(progressInterval)

const startProgress = () => {

  let from     = 0;  
  let to       = 100;  
  let duration = 3500;

  var start = new Date().getTime();
  progressInterval = setInterval(function() {
    var time = new Date().getTime() - start
    var x = easeOutCubic(time, from, to - from, duration)
    progress.value = x
    progress.innerHTML = `${x} %`
    if (time >= duration) clearInterval(progressInterval)
  }, 1000 / 60);
    progress.value = from
    progress.innerHTML = `${from} %`
}

forms['main'].elements['figma-tokens'].onclick = () => forms['main'].onsubmit = async (e: Event) => { 
  e.preventDefault()
  try {
    const p = await importColorsInFigmaTokens()
    console.log(p)
    
  } catch (error) {
    console.error(error)
  }
}
