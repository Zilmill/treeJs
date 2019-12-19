import { ObjectIs } from './validation'
/**
 * 根据给定的获取Dom
 * @param elOrIdOrClassname
 * @param defaultEl
 * @returns {*}
 * @constructor
 */
export function Dom (elOrIdOrClassname, defaultEl) {
  try {
    if (!elOrIdOrClassname) { return defaultEl }
    if (elOrIdOrClassname instanceof HTMLElement) {
      return elOrIdOrClassname
    }
    const el = document.querySelector(elOrIdOrClassname)
    if (el) { return el } else { return defaultEl }
  } catch (e) {
    console.error(e)
    return defaultEl
  }
}

/**
 * 查找dom
 * @param el
 * @param classOrTagName
 * @returns {*}
 */
export function elementFind (el, classOrTagName) {
  if (!(el instanceof HTMLElement)) { return }
  const children = el.childNodes
  let els = []
  for (let i = 0; i < children.length; i++) {
    const item = children[i]
    if (item.nodeName.toUpperCase() === classOrTagName.toUpperCase()) {
      els.push(item)
    } else if (item.classList.contains(classOrTagName)) {
      els.push(item)
    }
  }
  return els
}

/**
 * 删除页面
 * @param parent
 * @param els
 */
export function removeElement (els) {
  if (!Array.isArray(els)) { els = [els] }
  for (let i = 0; i < els.length; i++) {
    const item = els[i]
    item.parentNode.removeChild(item)
  }
}




