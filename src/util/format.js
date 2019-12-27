/**
 * 字节单位表
 * @type {Object}
 */
export const BYTE_UNITS = {
  B: 1,
  KB: 1024,
  MB: 1024 * 1024,
  GB: 1024 * 1024 * 1024,
  TB: 1024 * 1024 * 1024 * 1024
}

/**
 * 格式化字节值为包含单位的字符串
 * @param {number} size 字节大小
 * @param {number} [fixed=2] 保留的小数点尾数
 * @param {string} [unit=''] 单位，如果留空，则自动使用最合适的单位
 * @return {string} 格式化后的字符串
 */
export const formatBytes = (size, fixed = 2, unit = '') => {
  if (!unit) {
    if (size < BYTE_UNITS.KB) {
      unit = 'B'
    } else if (size < BYTE_UNITS.MB) {
      unit = 'KB'
    } else if (size < BYTE_UNITS.GB) {
      unit = 'MB'
    } else if (size < BYTE_UNITS.TB) {
      unit = 'GB'
    } else {
      unit = 'TB'
    }
  }

  return (size / BYTE_UNITS[unit]).toFixed(fixed) + unit
}
