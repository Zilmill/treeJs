import {createElement} from '../../util/jsx'
import { ObjectIs } from '../../util/validation'
import { elementFind, removeElement } from '../../util/dom'

let EmptyElement = null

/**
 * 头部ID
 * @param nodeId
 * @returns {string}
 */
export function getHeaderId (nodeId) {
  return `${nodeId}_header`
}

/**
 * check的id
 * @param nodeId
 * @returns {string}
 */
export function getHeaderCheckId (nodeId) {
  return `${getHeaderId(nodeId)}_check`
}

/**
 * 判断是否展开
 * @param nodeIdOrEl
 * @returns {boolean}
 */
export function isOpenExpend (nodeIdOrEl) {
  let header = nodeIdOrEl
  if (ObjectIs(nodeIdOrEl, 'string')) {
    header = document.getElementById(getHeaderId(nodeIdOrEl))
  }
  return header.classList.contains('open')
}

/**
 * 判断是否选中
 * @param nodeIdOrEl
 * @returns {boolean}
 */
export function isChecked (nodeIdOrEl) {
  let header = nodeIdOrEl
  if (ObjectIs(nodeIdOrEl, 'string')) {
    header = document.getElementById(getHeaderId(nodeIdOrEl))
  }
  if (header.classList.contains('checked')) { return true }
  if (header.classList.contains('half')) { return true }
  return false
}

/**
 * 每次更新的时候先清空
 */
export function clearView (parent) {
  const ul = elementFind(parent, 'tree_ul')
  removeElement(ul)
  if (EmptyElement) {
    removeElement(EmptyElement)
  }
}

/**
 * 创建父级
 * @param id
 * @param title
 * @param attrs
 * @param parent
 * @returns {*}
 */
export function createContent(parent, item, option) {
  const id = item._tree_node_id
  const title = item._tree_node_title
  const level = item._tree_node_level
  const hasChild = item._tree_node_children && item._tree_node_children.length
  // item
  const item_attrs = Object.assign({
    id: id,
  }, option.item_attrs)
  let el = document.getElementById(item_attrs.id)
  if (!el) {
    el = createElement(parent, 'ul', item_attrs)
  } else { return el }

  // header
  const header_attrs = Object.assign({
    id: getHeaderId(id)
  }, option.item_header_attrs)
  let header = document.getElementById(header_attrs.id)
  if (!header) { header = createElement(el, 'div', header_attrs) }
  header.classList.add(`level${level}`)
  if (!hasChild) { header.classList.add('no-child') }
  // 动态添加checked
  if (item._tree_node_checked) { header.classList.add('checked') }
  if (item._tree_node_check_half) { header.classList.add('half') }

  // 判断header内的顺序
  let sort = option.item_ui_sort
  if (!ObjectIs(option.item_ui_sort, 'array')) {
    sort = ['fold', 'label', 'check']
  }
  let checkEl = null
  sort.forEach(ui_key => {
    let child = ''
    let tag = 'div'
    if (ui_key === 'label') { child = title; tag = 'h3' }

    const el = createElement(header, tag, { class: `tree_header_${ui_key}`, id: `${getHeaderId(id)}_${ui_key}` }, child)
    if (ui_key === 'check') { checkEl = el }
  })

  return {
    header: header,
    check: checkEl
  }
}

/**
 * 绑定点击事件
 * @param item
 * @param expendEmit
 * @param checkEmit
 */
export function bindHeaderClickEvent (item, expendEmit, checkEmit) {
  const header = document.getElementById(getHeaderId(item._tree_node_id))
  const check = document.getElementById(getHeaderCheckId(item._tree_node_id))

  if (header) {
    header.addEventListener('click', e => { expendEmit(item, e) }, false)
  }
  if (check) {
    check.addEventListener('click',  e => { checkEmit(item, e) }, false)
  }
}

/**
 * 展开和关闭
 * @param item
 */
export function onHandleExpend (item) {
  const header = document.getElementById(getHeaderId(item._tree_node_id))
  if (!isOpenExpend(header)) {
    header.classList.add('open')
  } else {
    header.classList.remove('open')
    const parent = document.getElementById(item._tree_node_id)
    clearView(parent)
  }
}

/**
 * 选择
 * @param nodeId
 */
export function onHandleChecked (nodeId, checked, half) {
  const header = document.getElementById(getHeaderId(nodeId))
  if (!header) { return }
  if (checked) {
    header.classList.add('checked')
    if (half) {
      header.classList.add('half')
    } else {
      header.classList.remove('half')
    }
  } else {
    header.classList.remove('half')
    header.classList.remove('checked')
  }
}

/**
 * 显示空
 */
export function showEmpty (parent) {
  if (EmptyElement) { return }
  EmptyElement = createElement(parent, 'div', { class: 'treeJs_empty' }, '无内容')
}


