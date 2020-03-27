import _cloneDeep from 'lodash/cloneDeep'
import { ObjectIs } from '../../util/validation'
import md5 from '../../util/md5'
import _filter from 'lodash/filter'
import {
  createContent,
  bindHeaderClickEvent,
  onHandleExpend,
  isOpenExpend,
  onHandleChecked,
  clearView,
  showEmpty } from './view'
import Setting from '../setting'
import UUID from '../../util/uuid'

/**
 * 树
 */
export default class TreeRender {
  constructor (option, data, parent) {
    this.reset()
    this._parent = parent

    // 原始数据
    this.original = null

    return this.updateTree(data, option)
  }

  reset () {
    this._data = {}

    this.uuid = UUID()

    // 配置
    this.option = {}

    this._tree_data = {}

    // 当前项的父级
    this.parentData = {}

    // 当前项的子集
    this.childData = {}

    clearView(this._parent)
  }

  /**
   * 转化key值
   * @param index
   * @param arr
   * @param info
   * @returns {any | Promise<any>}
   */
  getKey (index, arr, info) {
    const _arr = arr.slice(0, index)
    const valArr = _arr.map(item => info[item])
    const id = valArr && valArr.length ? md5(`${valArr.join('@')}${this.uuid}`) : ''
    return id
  }

  /**
   * 先把提供的数据转化为平级的，再进行数据处理
   * @param data
   * @param option
   * @returns {Promise<void>}
   */
  async formatData (data, option) {

    let _data = _cloneDeep(data)

    if (ObjectIs(data, 'object')) {
      _data = _cloneDeep(Object.keys(data).map(k => data[k]))
    }

    // 按提供的层级分
    let level = option.level
    // 按提供的层级显示名称
    let level_title = option.level_title
    // 验证
    if (!ObjectIs(option.level, 'array')) {
      level = []
    }
    // 验证
    if (!ObjectIs(option.level_title, 'array')) {
      level_title = []
    }

    // 生成指定数据
    _data.forEach(_item => {
      level.forEach((key, index) => {
        const val = _item[key]
        if (ObjectIs(val, 'string') || ObjectIs(val, 'number')) {
          const pid = this.getKey(index, level, _item)
          const id = this.getKey(index + 1, level, _item)
          const title_key = level_title[index]

          this._data[id] = Object.assign({}, _item, {
            _tree_node_id: id,
            _tree_node_pid: pid,
            _tree_node_title: _item[title_key] || title_key,
            _tree_node_level: index + 1
          })
        } else {
          console.warn('此参数不是字符串，无法以此参数为一层', key, val)
        }
      })
    })

    return this._data
  }

  /**
   * 生成树形数据
   * @param _data
   * @returns {{}}
   */
  async formatDataToTree (_data) {
    return _filter(_data,item => {
      const arr = _filter(_data, child => child._tree_node_pid === item._tree_node_id)
      arr.length && (item._tree_node_children = arr)
      return !item.pid
    })
  }

  /**
   * 更新结构树，包括初始化
   * @param data
   * @param option
   * @returns {Promise<TreeRender>}
   */
  async updateTree (data, option, isFind) {
    if (!isFind) { this.original = data }

    const _option = !option ? this.option : Setting.updateTreeOption(option)

    this.reset()

    this.option = _option

    // 生成平级数据
    const _data = await this.formatData(data, this.option)

    this._tree_data = await this.formatDataToTree(_data)

    // 初始默认渲染第一级
    this.updateView(this._tree_data)

    return this
  }

  /**
   * 更新Dom
   * @param data
   */
  updateView (data) {
    let arr = data.filter(item => !item._tree_node_pid)
    let parent = null
    if (arr && arr.length) {
      parent = this._parent
    } else {
      arr = data
    }
    arr.forEach(item => {
      if (!parent) { parent = document.getElementById(item._tree_node_pid) || this._parent }
      createContent(parent, item, this.option)
      // 绑定事件
      bindHeaderClickEvent(item, (_item, e) => {
        this.expend(_item, e)
      }, (_item, e) => {
        this.check(_item, e)
      })
    })
  }

  /**
   * 展开收起
   * 展开时，创建子集
   * 收起时，销毁子集
   * @param item
   * @param e
   */
  expend (item, e) {
    const children = item._tree_node_children
    if (!(children && children.length)) { this.check(item, e); return }
    onHandleExpend(item)
    if (isOpenExpend(item._tree_node_id)) {
      this.updateView(children)
    }
  }

  /**
   * 选择
   * 选择时，记录当前项的所有子集和父级
   * 选择时，监控子集和父级的勾选
   * 同时handle一个
   * @param item
   * @param e
   * @param needEmit 是否需要触发回调
   */
  async check (item, e, bool, needEmit) {
    if (e) { e.stopPropagation() }

    let checkedIds = []

    const childData = await this.getChildData(item)

    const id = item._tree_node_id
    let toChecked = !this.isChecked(item)

    if (ObjectIs(bool, 'boolean')) { toChecked = bool }
    if (!ObjectIs(needEmit, 'boolean')) { needEmit = true }

    // 切换当前项选择
    item._tree_node_checked = toChecked
    item._tree_node_check_half = false
    onHandleChecked(id, toChecked, false)

    // 子集全部勾选
    if (childData && childData.length) {
      childData.forEach(childId => {
        const item = this._data[childId]
        item._tree_node_checked = toChecked
        item._tree_node_check_half = false
        onHandleChecked(childId, toChecked, false)
        if (!(item._tree_node_children && item._tree_node_children.length)) {
          checkedIds.push(item)
        }
      })
    } else {
      checkedIds.push(item)
    }

    // 父级判断是否选择
    this.checkParent(item, toChecked, (pid, checked, half) => {
      onHandleChecked(pid, checked, half)
    })

    // 回调选择
    if (needEmit) { this.onChecked(checkedIds, toChecked) }
  }

  /**
   * 判断是否选中
   * @param item
   * @returns {boolean}
   */
  isChecked (item) {
    if (!item) { return false }
    if (item._tree_node_checked) { return true }
    if (item._tree_node_check_half) { return true }
    return false
  }

  /**
   * 选中父级元素
   * @param item
   * @param toChecked
   * @param call
   */
  checkParent (item, toChecked, call) {
    const recursive = _pid => {
      if (!_pid) { return }
      const parentItem = this._data[_pid]
      // has 代表至少有一个选中了
      const { checked, has } = this.childIsAllChecked(parentItem)
      if (toChecked) {
        parentItem._tree_node_checked = true
        if (!checked) {
          parentItem._tree_node_check_half = true
        } else {
          parentItem._tree_node_check_half = false
        }
      } else {
        if (has) {
          parentItem._tree_node_checked = true
          parentItem._tree_node_check_half = true
        } else {
          parentItem._tree_node_checked = false
          parentItem._tree_node_check_half = false
        }
      }
      call && call(_pid, parentItem._tree_node_checked, parentItem._tree_node_check_half)
      recursive(parentItem._tree_node_pid)
    }
    recursive(item._tree_node_pid)
  }

  /**
   * 监听选择
   * @param checkedIds
   */
  onChecked (checkedIds, bool) {
    if (ObjectIs(this.option.onCheck, 'function')) {
      this.option.onCheck(checkedIds, bool)
    }
  }

  /**
   * 通过父级id，获取所有子集ID
   * @param pid
   * @returns {Array}
   */
  async getParentData (item) {
    const id = item._tree_node_id

    if (this.parentData[id]) { return this.parentData[id] }

    let arr = []
    const recursive = _item => {
      const pid = _item._tree_node_pid
      if (!pid) { return }
      arr.push(pid)
      recursive(this._data[pid])
    }

    await recursive(item)

    this.parentData[id] = arr

    return arr
  }

  /**
   * 通过子集ID，获取所有父级ID
   * @param id
   * @returns {Array}
   */
  async getChildData (item) {
    const id = item._tree_node_id

    if (this.childData[id]) { return this.childData[id] }

    let arr = []
    function recursive (_item) {
      const children = _item._tree_node_children
      if (children && children.length) {
        children.forEach(child => {
          arr.push(child._tree_node_id)
          recursive(child)
        })
      }
    }

    await recursive(item)

    this.childData[id] = arr

    return arr
  }

  /**
   * 第一层子集是否都是选中的
   * @param id
   * @returns {boolean}
   */
  childIsAllChecked (item) {
    const children = item._tree_node_children
    if (!(children && children.length)) { return true }
    let checked = true
    let total = 0
    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (!child._tree_node_checked) {
        checked = false
      } else { total++ }
      if (child._tree_node_check_half) {
        checked = false
      }
    }
    return { checked, has: checked ? true : !!total }
  }

  /**
   * 通过名称搜索
   * 或者匹配任意字符
   * 优先通过level_title字段
   * @param nameOrKeyValue
   */
  find (value, _option) {
    if (!_option) { _option = {} }
    const reg = new RegExp(value, 'ig')
    let result = []
    let titles = _option.level_title || this.option.level_title
    const data = _option.data || this.original
    if (!Array.isArray(titles)) { titles = [titles] }

    const recursive = item => {
      // 按标题查找
      for (let i = 0; i < titles.length; i++) {
        const title = titles[i]
        const val = item[title]
        const isSame = reg.test(val) || val === value
        if (isSame) { result.push(item) }
      }
    }

    if (ObjectIs(data, 'array')) {
      for (let i = 0; i < data.length; i++) {
        recursive(data[i])
      }
    } else if (ObjectIs(data, 'object')) {
      for (let i in data) {
        recursive(data[i])
      }
    }

    return result
  }

  /**
   * 筛选指定条件
   * @param {Object|null} _option 
   * @param {Function} callback 
   */
  filter (_option, callback) {
    let result = []
    if (!_option) { _option = {} }
    const data = _option.data || this.original

    if (ObjectIs(data, 'array')) {
      for (let i = 0; i < data.length; i++) {
        const res = callback && callback(data[i])
        if (res) { result.push(data[i]) }
      }
    } else if (ObjectIs(data, 'object')) {
      for (let i in data) {
        const res = callback && callback(data[i])
        if (res) { result.push(data[i]) }
      }
    }

    return result
  }

  /**
   * 搜索并更改UI
   * @param val
   * @param option
   * @returns {null}
   */
  searchUpdateUI (val, option) {
    const _option = Object.assign({}, this.option, option)
    if (!val) {
      this.updateTree(this.original, _option)
      return null
    }

    if (ObjectIs(_option.search_option, 'array')) {
      _option.level_title = _option.level_title.concat(_option.search_option)
    }

    const result = this.find(val, _option)

    this.updateTree(result, _option, true)

    if (!(result && result.length)) { showEmpty(this._parent) }
  }

  /**
   * 主动选中或取消选中某些
   * 如果已经展开了，直接勾选上，如果没有展开，只改变数据
   * @param key
   * @param value
   */
  checkSomeOne (value, key, bool, needEmit) {
    if (!Array.isArray(value)) { value = [value] }
    if (!key) {
      key = this.option.level_title
    }
    if (!Array.isArray(key)) { key = [key] }
    let arr = []
    value.forEach(item => {
      const result = this.find(item, { data: this._data, level_title: key })
      if (result && result.length) {
        arr = arr.concat(
          result.filter(_item => {
            return !(_item._tree_node_children && _item._tree_node_children.length)
          })
        )
      }
    })
    arr.forEach(async (item) => {
      this.check(item, null, bool, needEmit)
    })
  }

  /**
   * 获取当前已经被选中的
   * @param data
   * @param withParent
   * @returns {Array}
   */
  getAllChecked (data, withParent) {
    const _data = data || this._data
    let arr = []
    for (let key in _data) {
      const item = _data[key]
      if (item._tree_node_checked) {
        if (withParent) {
          arr.push(item)
        } else {
          if (!(item._tree_node_children && item._tree_node_children.length)) {
            arr.push(item)
          }
        }
      }
    }

    return arr
  }

  /**
   * 获取所有未被选中的
   * @param data
   * @param withParent
   * @returns {Array}
   */
  getAllNotChecked (data, withParent) {
    const _data = data || this._data
    let arr = []
    for (let key in _data) {
      const item = _data[key]
      if (!item._tree_node_checked) {
        if (withParent) {
          arr.push(item)
        } else {
          if (!(item._tree_node_children && item._tree_node_children.length)) {
            arr.push(item)
          }
        }
      }
    }

    return arr
  }
}
