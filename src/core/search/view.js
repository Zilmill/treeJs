import { createElement } from '../../util/jsx'

// 创建父级元素
export function createSearchParent(parent, attrs) {
  return createElement(parent, 'div', attrs)
}

// 创建输入框
export function createSearchInput(parent, attrs) {
  const div = createElement(parent, 'div', attrs)
  return {
    input: createElement(div, 'input', Object.assign({
      type: 'text',
      placeholder: '请输入搜索内容'
    })),
    div: div
  }
}

// 创建提交确认按钮
export function createSearchSubmit(parent, attrs, label) {
  return createElement(parent, 'button', Object.assign({
    type: 'button'
  }, attrs), label)
}

