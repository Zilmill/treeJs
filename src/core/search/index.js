import { ObjectIs } from '../../util/validation'
import { createSearchParent, createSearchInput, createSearchSubmit } from './view'
import timeout from '../../util/timeout'

/**
 * 搜索框
 */
export default class SearchRender {
  constructor (option, parent) {
    // 判断是否需要搜索
    if (ObjectIs(option, 'boolean')) { if (option) { return } }

    // 判断是否是外部传入搜索组件
    if (ObjectIs(option.slot, 'function')) {
      const searchEl = option.slot(parent)
      if (searchEl && searchEl instanceof HTMLElement ) {
        this.el = searchEl
        return this
      }
    }

    this._option = option

    // 未传入搜索组件，创建父级dom
    this.el = createSearchParent(parent, option.parent_attrs)

    // 判断是否传入的input组件
    const {input, div } = createSearchInput(this.el, option.input_attrs)
    this.input_el = input

    // 判断是否传入了提交组件
    if (option.submit) {
      if (ObjectIs(option.submit_slot, 'function')) {
        const submitEl = option.slot(this.el)
        if (submitEl && submitEl instanceof HTMLElement) {
          this.submit_el = submitEl
        }
      }
      if (!this.submit_el) {
        this.submit_el = createSearchSubmit(this.el, option.submit_attrs, option.submit_label)
      }
    }

    // 暴露所有的dom，让外面可以加dom
    if (ObjectIs(option.other_slot, 'function')) {
      option.other_slot(this.el, div, this.submit_el)
    }

    this.bindEvent()
  }

  bindEvent () {
    this.onInput = this.onInput.bind(this)
    this.onChange = this.onChange.bind(this)
    this.onBlur = this.onBlur.bind(this)
    this.onSubmit = this.onSubmit.bind(this)

    if (this.input_el) {
      this.input_el.addEventListener('input', this.onInput, false)
      this.input_el.addEventListener('change', this.onChange, false)
      this.input_el.addEventListener('blur', this.onBlur, false)
    }
    if (this.submit_el) {
      this.submit_el.addEventListener('click', this.onSubmit, false)
    }
  }

  unbindEvent () {
    if (this.input_el) {
      this.input_el.removeEventListener('input', this.onInput, false)
      this.input_el.removeEventListener('change', this.onChange, false)
      this.input_el.removeEventListener('blur', this.onBlur, false)
    }
    if (this.submit_el) {
      this.submit_el.removeEventListener('click', this.onSubmit, false)
    }
  }

  onInput (e) {
    this.emit('onInput', e)
  }

  onChange (e) {
    this.emit('onChange', e)
    this.startSearch()
  }

  onBlur (e) {
    this.emit('onChange', e)
    this.startSearch()
  }

  onSubmit () {
    this.emit('onChange')
    this.startSearch()
  }

  emit (key, e) {
    if (this._option[key] && ObjectIs(this._option[key], 'function')) {
      this._option[key](e, this.input_el.value)
    }
  }

  async startSearch () {
    await timeout(500)
    const val = this.input_el.value
    console.log('val', val)
  }
}


