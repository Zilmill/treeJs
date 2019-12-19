/**
 * 时间改
 * @param timeout
 * @returns {Promise<any>}
 */
let timer = null
export default function timeout (timeout) {
  return new Promise(resolve => {
    clearTimeout(timer)
    timer = setTimeout(resolve, timeout)
  })
}
