import {isTabbar} from './util'
import Bus from './bus'
import View from './view'

let curr = null
let views = {}
let tabViews = {}

function onRoute() {
  window.location.hash = curr.path
  Bus.emit('route', getViewIds().length, curr)
}

export function redirectTo(path) {
  path = normalize(path)
  if (!curr) throw new Error('Current view not exists')
  let pid = curr.pid
  curr.destroy()
  delete views[curr.id]
  eachView(view => {
    if (view.url == path) throw new Error(`Page ${path} already exists`)
  })
  let v = curr = new View(path)
  curr.pid = pid
  views[curr.id] = v
  onRoute()
}

export function navigateTo(path, isTab) {
  path = normalize(path)
  eachView(view => {
    if (!isTab && view.url == path) throw new Error(`Page ${path} already exists`)
  })
  let exists = tabViews[path]
  if (curr) curr.hide()
  if (exists) {
    curr = exists
    exists.show()
  } else {
    let isTabView = isTabbar(path)
    let pid = curr ? curr.id : null
    let v = curr = new View(path)
    curr.pid = isTabView ? null : pid
    views[v.id] = v
    if (isTabView) tabViews[path] = curr
  }
  onRoute()
}

export function navigateBack() {
  if (!curr) throw new Error('Current page not exists')
  let pid = curr.pid
  if (pid == null) throw new Error(`Parent webview id not found on view-${curr.id}`)
  curr.destroy()
  delete views[curr.id]
  curr = views[pid]
  curr.show()
  onRoute()
}

export function currentView() {
  return curr
}

export function getViewById(id) {
  return views[id]
}

export function getViewIds() {
  let ids = Object.keys(views).map(id => Number(id))
  return ids
}

export function eachView(fn) {
  let ids = getViewIds()
  ids.forEach(id => {
    fn.call(null, views[id])
  })
}

export function notifyViews(msg) {
  eachView(view => {
    view.postMessage({
      msg: msg,
      command: 'CUSTOM'
    })
  })
}

function normalize(p) {
  return p.replace(/\.html/, '').replace(/^\.?\//, '')
}