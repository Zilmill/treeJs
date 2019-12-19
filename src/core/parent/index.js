import { createElement } from '../../util/jsx'
export default class ParentRender {
  constructor (option, parent) {
    const el = createElement(parent, 'div', { class: option.class})
    return el
  }
}
