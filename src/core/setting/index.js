/**
 * 配置信息
 * 可不传，用默认配置
 * 传了，判断类型是对象，即配置，
 * 类型是数组即需要生成的树数据，无配置
 * 类型错了，也代表无配置
 */
import _cloneDeep from 'lodash/cloneDeep'
import { ObjectIs, isFalse } from '../../util/validation'
import DEFAULT_SETTING from './setting.default'

let SETTING = null

export default class Setting {
  constructor (setting) {
    let _setting = null
    // 如果setting直接给的数组，那么就是树的数据
    if (ObjectIs(setting, 'array') && setting.length) {
      _setting = Object.assign({}, DEFAULT_SETTING, { data: setting })
    }

    // 如果传入对象，那么只识别部分参数
    if (ObjectIs(setting, 'object')) {
      _setting = Object.assign({}, DEFAULT_SETTING)
      // 数据验证
      if (ObjectIs(setting.data, 'array')) {
        _setting.data = setting.data
      } else if (ObjectIs(setting.data, 'object')) {
        _setting.data = Object.keys(setting.data).map( k => setting.data[k])
      } else {
        _setting.data = DEFAULT_SETTING.data
      }
      // 搜索功能配置
      if (ObjectIs(setting.search, 'object')) {
        _setting.search = Object.assign({}, DEFAULT_SETTING.search, setting.search)
      } else if (ObjectIs(setting.search, 'boolean')) {
        // 传入true用默认的，false，则不用
        if (setting.search) { _setting.search = DEFAULT_SETTING.search } else { _setting.search = false }
      } else {
        _setting.search = DEFAULT_SETTING.search
      }
      // 树的数据
      if (ObjectIs(setting.tree, 'object')) {
        _setting.tree = Object.assign({}, DEFAULT_SETTING.tree, setting.tree)
      } else {
        _setting.tree = DEFAULT_SETTING.tree
      }
    }

    if (_setting) {
      SETTING = _cloneDeep(Object.assign({}, DEFAULT_SETTING, _setting))
    } else {
      SETTING = _cloneDeep(DEFAULT_SETTING)
    }
  }

  get parent () { return SETTING.parent }

  get data () { return SETTING.data }

  get search () { return SETTING.search }

  get tree () { return SETTING.tree }

}
