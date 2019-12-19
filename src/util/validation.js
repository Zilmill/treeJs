/**
 * 判断类型是否是指定类型
 * @param object
 * @param type
 * @returns {boolean}
 * @constructor
 */
export const ObjectIs = (object, type) => {
  const str = Object.prototype.toString.call(object)
  const _type = str.split(' ')[1].replace(']', '')
  return _type.toUpperCase() === type.toUpperCase()
}

/**
 * 判断是否是false
 * @param val
 * @returns {boolean}
 */
export const isFalse = (val) => {
  if (!ObjectIs(val, 'boolean')) { return false }
  return !val || false
}
