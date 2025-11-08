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

export default function myPlugin() {
    return {
      name: 'vite-plugin-auto-component',
  
      transform(code, id) {
        // 非.vue文件不处理
        if(/\.vue$/.test(id)) {
            const s = new MagicString(code)
            const results = []
            for (const match of code.matchAll(/_?resolveComponent\d*\("(.+?)"\)/g)) {
                const matchedName = match[1]
                if (match.index != null && matchedName && !matchedName.startsWith('_')) {
                  const start = match.index
                  const end = start + match[0].length
                  results.push({
                    rawName: matchedName,
                    replace: resolved => s.overwrite(start, end, resolved),
                  })
                }
            }

            for (const { rawName, replace } of results) {
                // const name = pascalCase(rawName)
   
                const varName = `CoButton`
                s.prepend(`import CoButton from 'cobyte-vite-ui/dist/components/button';\nimport 'cobyte-vite-ui/dist/style.css';\n`)

                replace(varName)
            }

            return {
                code: s.toString(),
                map: null,
            }
        }
      },
    }
  }