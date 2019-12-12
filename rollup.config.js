import path from 'path'
import _package from './package.json'
import alias from 'rollup-plugin-alias'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import nodeResolve from 'rollup-plugin-node-resolve'
import flow from 'rollup-plugin-flow-no-whitespace'
import { eslint } from 'rollup-plugin-eslint';
import notify from 'rollup-plugin-notify'
import babel from 'rollup-plugin-babel'
import { terser } from "rollup-plugin-terser";
import fse from 'fs-extra'

import serve from 'rollup-plugin-serve'
import liveReload from 'rollup-plugin-livereload'

// 转换文件路径
const aliasResolve = p => path.resolve(__dirname, './', p)

// 首字母大写
const firstUppercase = ([first, ...other]) => `${first.toUpperCase()}${other.join('')}`

// 自定义路径
const aliases = {
    '~': aliasResolve('src')
}

// 不打包的特性
const feature = {}

// 插件名称
const _name = _package.moduleName || firstUppercase(_package.name)

// 插件版本
const version = _package.version

// 打包路径
const outputDir = _package.output || 'dist'

// 头部copy right
const banner =
  '/*!\n' +
  ` * ${_name} v${version}\n` +
  ` * (c) 2019-${new Date().getFullYear()} Evan You\n` +
  ' * Released under the MIT License.\n' +
  ' */'

// 转换路径
const resolve = p => {
    const base = p.split('/')[0]
    if (aliases[base]) {
        return path.resolve(aliases[base], p.slice(base.length + 1))
    } else {
        return path.resolve(__dirname, './', p)
    }
}

// 生成build
const getOption = (format, info = {}) => {
    const entryPath = info.entryPath || '~/index.js'
    const dest = info.dest
    const env = info.env || 'development'
    const _dest = dest || `${outputDir}/index.${format}${/dev/.test(env) ? '' : '.min'}.js`
    return {
        entry: resolve(entryPath),
        dest: resolve(_dest),
        format: format,
        env: env,
        banner
    }
}

// 需要生成的文件
const builds = {
    'iife': getOption('iife'),
    'es': getOption('es'),
    'umd': getOption('umd'),
    'iife-min': getOption('iife', { env: 'production' }),
}

// 生成单个config
const getConfig = (option, name) => {
    if (!option) { return }
    const vars = {
        _name: name,
        __VERSION__: version
    }
    Object.keys(feature).forEach(key => {
        vars[`process.env.${key}`] = feature[key]
    })
    if (option.env) {
        vars['process.env.NODE_ENV'] = JSON.stringify(option.env)
    }
    const config = {
        input: option.entry,
        external: option.external || [],
        plugins: [
            nodeResolve(),
            commonjs(),
            eslint({
                exclude: [
                    'src/assets/**',
                ]
            }),
            babel({
                runtimeHelpers: true,
                exclude: 'node_modules/**'
            }),
            notify(),
            flow(),
            alias(Object.assign({}, aliases, option.alias)),
            terser({
                include: [/^.+\.min\.js$/]
            })
        ].concat(option.plugins || []).concat([replace(vars)]),
        output: {
            env: option.env,
            file: option.dest,
            format: option.format,
            banner: option.banner,
            name: option.moduleName || _name
        },
        onwarn: (msg, warn) => {
            if (!/Circular/.test(msg)) {
                warn(msg)
            }
        }
    }

    return config
}

// 清楚文件夹
if (fse.pathExistsSync(outputDir)) { fse.removeSync(outputDir) }
fse.ensureDirSync(outputDir)

if (process.env.TARGET) {
    const option = builds[process.env.TARGET]
    if (!option) { throw new Error('无此配置') }
    option.dest = resolve(`${outputDir}/index.js`)

    const config = getConfig(option, process.env.TARGET)
    config.plugins = config.plugins.concat([
        serve({
            open: true,
            contentBase: `./`,
            historyApiFallback: true,
            host: 'localhost',
            port: 10001,
        }),
        liveReload()
    ])
    module.exports = config
} else {
    module.exports = Object.keys(builds).map(name => getConfig(builds[name], name))
}




