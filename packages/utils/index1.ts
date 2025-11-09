import MagicString from 'magic-string'
export function pascalCase(str: string) {
    return capitalize(camelCase(str))
  }
  
export function camelCase(str: string) {
    return str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ''))
}

export function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export default function VitePluginAutoComponents() {
  return {
    // 插件名称，用于调试和错误信息
    name: 'vite-plugin-auto-component',

    // transform 钩子函数，在转换模块时调用
    // code: 文件内容，id: 文件路径
    transform(code, id) {
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

          // 遍历所有匹配结果进行处理
          for (const { rawName, replace } of results) {
              // 定义要替换的变量名（这里暂时编码为 CoButton）
              const varName = `CoButton`
              // 在代码开头添加导入语句：
              // 1. 导入 CoButton 组件
              // 2. 导入样式文件
              s.prepend(`\nimport CoButton from 'cobyte-vite-ui/dist/components/button';\nimport 'cobyte-vite-ui/dist/style.css';\n`)

              // 执行替换：将 resolveComponent("xxx") 调用替换为组件变量名
              replace(varName)
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