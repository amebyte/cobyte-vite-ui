import MagicString from 'magic-string'
// 将字符串转换为帕斯卡命名（即大驼峰，每个单词首字母大写）
export function pascalCase(str: string) {
    return capitalize(camelCase(str))
}
// 将字符串转换为驼峰命名  
export function camelCase(str: string) {
    return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}
// 将字符串的首字母大写，使用 charAt(0) 获取第一个字符并转换为大写，然后加上剩余字符串（从索引1开始）
export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}
// 将驼峰命名的字符串转换为短横线分隔的字符串（即kebab-case）
export function kebabCase(key: string) {
    const result = key.replace(/([A-Z])/g, ' $1').trim()
    return result.split(' ').join('-').toLowerCase()
}

// 根据传入的信息生成对应的导入语句字符串
export function stringifyImport(info) {
    if (typeof info === 'string')
      return `import '${info}'`
    if (!info.as)
      return `import '${info.from}'`
    else if (info.name)
      return `import { ${info.name} as ${info.as} } from '${info.from}'`
    else
      return `import ${info.as} from '${info.from}'`
}
// 根据组件的导入信息生成完整的导入语句，包括组件本身的导入和其副作用（如样式文件）的导入。
export function stringifyComponentImport({ as: name, from: path, name: importName, sideEffects }) {
    const imports = [
      // 生成组件导入语句
      stringifyImport({ as: name, from: path, name: importName }),
    ]
  
    if (sideEffects) {
      // 生成副作用导入语句
      sideEffects.forEach(i => imports.push(stringifyImport(i)))
    }
  
    return imports.join(';')
}

// 解析器函数
export function CobyteViteUiResolver() {
  return {
    type: 'component',
    resolve: (name: string) => {
      // 只处理 Co 开头的组件
      if (name.match(/^Co[A-Z]/)) {
        const partialName = kebabCase(name.slice(2)) // CoTableColumn -> table-column
        return { 
          name, 
          from: `cobyte-vite-ui/dist/components/${partialName}`, 
          sideEffects: ['cobyte-vite-ui/dist/style.css'] 
        }
      }
    },
  }
}

/**
 * Resolver for Naive UI
 *
 * @link https://www.naiveui.com/
 */
export function NaiveUiResolver() {
  return {
    type: 'component',
    resolve: (name: string) => {
      console.log('NaiveUiResolver', name, name.match(/^(N[A-Z]|n-[a-z])/));
      if (name.match(/^(N[A-Z]|n-[a-z])/))
        return { name, from: 'naive-ui' }
    },
  }
}

export class Context {
  options: any;
  private _componentNameMap = {} // 组件缓存
  constructor(private rawOptions: any) {
    this.options = rawOptions
  }

  async findComponent(name: string) {
    // 1. 检查缓存中是否有该组件的信息
    let info = this._componentNameMap[name]
    if (info) {
      return info // 缓存命中，直接返回
    }
    // 2. 遍历所有解析器
    for (const resolver of this.options.resolvers) {
      const result = await resolver.resolve(name)
      // 3. 判断解析器是否返回了结果
      if (!result) {
        continue
      }
      // 4. 构建完整组件信息
      info = {
        as: name, // 添加别名
        ...result,
      }
      // 5. 存入缓存
      this._componentNameMap[name] = info
      return info
    }
    // 所有解析器都不匹配，返回 undefined
  }
}

export default function VitePluginAutoComponents(options) {
  // 创建 Context 实例，用于存储插件配置和组件信息
  const ctx = new Context(options)
  return {
    // 插件名称，用于调试和错误信息
    name: 'vite-plugin-auto-component',

    // transform 钩子函数，在转换模块时调用
    // code: 文件内容，id: 文件路径
    async transform(code, id) {
      // 使用正则表达式检查文件是否为.vue文件
      // 如果不是.vue文件，不进行处理
      if(/\.vue$/.test(id)) {
          // 创建 MagicString 实例，用于高效地修改字符串并生成 source map
          const s = new MagicString(code)
          // 初始化结果数组，用于存储匹配到的组件信息
          const results = []

          // 使用 matchAll 方法查找所有匹配的 resolveComponent 调用
          // 正则表达式解释：
          // _?resolveComponent\d* - 匹配可能的函数名变体（可能带下划线或数字后缀）
          // \("(.+?)"\) - 匹配括号内的字符串参数
          // g - 全局匹配
          for (const match of code.matchAll(/_?resolveComponent\d*\("(.+?)"\)/g)) {
              // match[1] 是第一个捕获组，即组件名称字符串
              const matchedName = match[1]
              // 检查匹配是否有效：
              // match.index != null - 确保有匹配位置
              // matchedName - 确保捕获到组件名
              // !matchedName.startsWith('_') - 确保组件名不以_开头（可能是内部组件）
              if (match.index != null && matchedName && !matchedName.startsWith('_')) {
                  // 计算匹配字符串的起始位置
                  const start = match.index
                  // 计算匹配字符串的结束位置
                  const end = start + match[0].length
                  // 将匹配信息存入结果数组
                  results.push({
                      rawName: matchedName,  // 原始组件名称
                      // 创建替换函数，使用 MagicString 的 overwrite 方法替换指定范围的文本
                      replace: resolved => s.overwrite(start, end, resolved),
                  })
              }
          }
          let no = 0
          // 遍历所有匹配结果进行处理
          for (const { rawName, replace } of results) {
              // 将字符串转换为大驼峰
              const name = pascalCase(rawName)
              const component = await ctx.findComponent(name)
              if (component) {
                // 定义要替换的变量名（这里暂时编码为 CoButton）
                // const varName = name
                // 使用特殊前缀减少与用户变量的冲突，以及使用递增的序号，保证唯一性，避免变量名冲突
                const varName = `__unplugin_components_${no}`
                // 在代码开头添加导入语句：
                // 1. 导入 CoButton 组件
                // 2. 导入样式文件
                // s.prepend(`\nimport ${varName} from 'cobyte-vite-ui/dist/components/${partialName}';\nimport 'cobyte-vite-ui/dist/style.css';\n`)
                // 这里将 component 对象展开，并添加 as: varName 参数，形成完整的导入配置
                s.prepend(`${stringifyComponentImport({ ...component, as: varName })};\n`)
                no += 1
                // 执行替换：将 resolveComponent("xxx") 调用替换为组件变量名
                replace(varName)
              }
          }

          // 返回转换后的代码
          return {
              code: s.toString(),  // 转换后的代码字符串
              map: null, 
          }
      }
    },
  }
}