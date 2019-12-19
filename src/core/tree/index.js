import _cloneDeep from 'lodash/cloneDeep'
import { ObjectIs } from '../../util/validation'
import md5 from '../../util/md5'
import _filter from 'lodash/filter'
import {
  createContent,
  bindHeaderClickEvent,
  onHandleExpend,
  isOpenExpend,
  isChecked,
  onHandleChecked,
  clearView } from './view'
import Setting from '../setting'

/**
 * 树
 * TODO data为数组时
 */
export default class TreeRender {
  constructor (option, data, parent) {
    this.reset()
    this._parent = parent

    return this.updateTree(data, option)
  }

  reset () {
    this._data = {}

    // 原始数据
    this.original = null

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
   * 转化Key
   * @param key
   * @returns {*}
   */
  getKey (key, pid) {
    return key ? md5(pid ? `${key}${pid}` : key.toString()) : ''
  }

  /**
   * 先把提供的数据转化为平级的，再进行数据处理
   * @param data
   * @param option
   * @returns {Promise<void>}
   */
  async formatData (data, option) {
    this.original = data

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
          const prevKey = level[index - 1]
          const preVal = _item[prevKey]
          const pid = this.getKey(preVal, _item[level[index - 2]])
          const id = this.getKey(val, preVal)
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
  async updateTree (data, option) {
    this.reset()

    this.option = Setting.updateTreeOption(option)

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
      if (!parent) { parent = document.getElementById(item._tree_node_pid) }
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
   */
  async check (item, e) {
    e.stopPropagation()
    let checkedIds = []

    const childData = await this.getChildData(item)

    const id = item._tree_node_id
    const toChecked = !isChecked(id)

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
        if (!(item._tree_node_children && item._tree_node_children)) {
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
    this.onChecked(checkedIds)
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
  onChecked (checkedIds) {
    if (ObjectIs(this.option.onCheck, 'function')) {
      this.option.onCheck(checkedIds)
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
}
