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

    console.log('将要放入的元素:', this._elOrIdOrClassname, this.el)
    console.log('配置信息:', this.setting)

    this.render()
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
    // 创建最外层父级
    this.root = await new ParentRender(this.setting.parent, this.el)

    // 创建搜索框
    this.search = await new SearchRender(this.setting.search, this.root)

    // 创建树
    this.tree = await new TreeRender(this.setting.tree, this.setting.data, this.root)
  }
}
