/**
 * 用于判断和生产Vnode
 */
export class Vnode {
  constructor (tag, attrs, ...children) {
    this.tag = tag
    this.attrs = attrs
    this.children = children
    return this
  }
}

/**
 * 判断是否是Vnode
 * @param vnode
 * @returns {boolean}
 */
export const isVnode = vnode => vnode instanceof Vnode

/**
 * 创建 Vnode
 * @param tag
 * @param attrs
 * @param children
 * @returns {{children: *[], tag: *, attrs: *}}
 */
export function createVnode(tag, attrs, ...children){
  return new Vnode(tag, attrs, ...children)
}

/**
 * 渲染界面
 * @param vnode
 * @param container
 * @returns {*}
 */
export function render(vnode, container) {
  //当vnode为字符串时，渲染结果是一段文本
  if (typeof vnode !== "object") {
    const textNode = document.createTextNode(vnode)
    return container.appendChild(textNode)
  }

  if (!isVnode(vnode)) { console.error('非Vnode类', vnode); return }

  let dom = document.createElement(vnode.tag)
  if (vnode.tag === 'svg' || vnode.tag === 'path') {
    dom = document.createElementNS('http://www.w3.org/2000/svg', vnode.tag)
  }

  //设置属性
  if (vnode.attrs) {
    Object.keys(vnode.attrs).forEach(key => {
      const value = vnode.attrs[key]
      dom.setAttribute(key, value)
    })
  }
  //递归渲染子节点
  vnode.children && vnode.children.forEach(child=> render(child, dom))

  return container.appendChild(dom)
}

/**
 * 创建元素
 * @param parentEl
 * @param tag
 * @param attrs
 * @param children
 */
export function createElement(parentEl, tag, attrs, ...children) {
  const el = document.createDocumentFragment()
  const vnode = createVnode(tag, attrs, ...children)
  return parentEl.appendChild(render(vnode, el))
}
