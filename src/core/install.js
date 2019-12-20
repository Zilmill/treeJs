import Setting from './setting'
import { Dom } from '../util/dom'
import ParentRender  from './parent'
import SearchRender from './search'
import TreeRender from './tree'

/**
 * 生成树
 */
export class Install {
  constructor (elOrIdOrClassname, settingOrData) {
    this._elOrIdOrClassname = elOrIdOrClassname
    this.setting = new Setting(settingOrData)

    return this.render()
  }

  /**
   * 树要放入的HTMLElement
   * @returns {*}
   */
  get el () {
    return new Dom(this._elOrIdOrClassname, document.body)
  }

  /**
   * 开始渲染
   * @returns {Promise<void>}
   */
  async render () {
    if (this.root) { return }
    // 创建最外层父级
    this.root = await new ParentRender(this.setting.parent, this.el)

    // 创建搜索框
    this.search = await new SearchRender(this.setting.search, this.root)

    // 创建树
    this.tree = await new TreeRender(this.setting.tree, this.setting.data, this.root)

    // 监听搜索
    this.search.onSearch(val => {
      this.searchUpdateUI(val)
    })

    return this
  }

  /**
   * 更新结构树数据
   */
  find (val, option) {
    return this.tree.find(val, option)
  }

  /**
   * 搜索功能
   * @param val
   * @param option
   */
  searchUpdateUI (val, option) {
    this.tree.searchUpdateUI(val, option)
  }

  /**
   * 选择某个
   * @param value
   * @param key
   * @param bool
   */
  checkSomeOne (value, key, bool, needEmit) {
    this.tree.checkSomeOne(value, key, bool, needEmit)
  }

  /**
   * 获取当前已经选中的
   * @param data
   * @param withParent
   */
  getAllChecked (data, withParent) {
    return this.tree.getAllChecked(data, withParent)
  }

  /**
   * 更新树
   * @param data
   * @param option
   * @param isFind
   * @returns {*|Promise<TreeRender>}
   */
  updateTree (data, option, isFind) {
    return this.tree.updateTree(data, option, isFind)
  }
}
