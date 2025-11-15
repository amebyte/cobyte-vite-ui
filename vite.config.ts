import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path, { resolve } from "path";
import fs from "fs";
import AutoComponents from 'unplugin-vue-components/vite';
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers';

// 动态获取组件目录列表
const componentsDir = resolve(__dirname, "./packages/components");
const modules = fs.readdirSync(componentsDir).filter((name) => {
    const fullPath = path.join(componentsDir, name);
    // 只获取目录，排除文件
    return fs.statSync(fullPath).isDirectory();
});

const entryArr = {
    // 主入口
    index: resolve(__dirname, "./packages/components/index.ts"),

    // 工具入口
    utils: resolve(__dirname, "./packages/utils/index.ts"),
};

// 为每个组件创建独立入口
modules.forEach((name) => {
    entryArr[`components/${name}/index`] = resolve(__dirname, `./packages/components/${name}/index.ts`);
});

export default defineConfig(({ command, mode }) => {
    // 主构建配置
    return {
        plugins: [
            vue(),
            AutoComponents({
                resolvers: [NaiveUiResolver()]
            })
        ],
        build: {
            minify: false, // 禁止压缩混淆
            lib: {
                entry: entryArr,
                formats: ["es"], // 只构建 ES 模块
                cssFileName: "style",
            },
            rollupOptions: {
                external: [
                    "vue",
                    "naive-ui",
                ],
                output: {
                    format: "es",
                    preserveModules: true,
                },
            },
        },
    };
});