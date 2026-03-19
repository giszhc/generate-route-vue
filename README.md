# @giszhc/generate-route-vue

一个 **基于文件系统的 Vue Router 动态路由生成工具**，
用于根据约定的目录结构自动生成 `vue-router` 路由配置。

适用于 **Vite + Vue 3 + Vue Router 4** 项目，减少手写路由表的维护成本。

------

## 特性

- 🚀 基于 `import.meta.glob` 自动生成路由
- 🧠 约定式目录结构，零侵入
- 🌲 支持扁平路由 / 树形路由
- 🧩 自动解析 `page.ts` 中的 meta 信息
- 🔁 支持默认重定向配置
- 🧪 完整 TypeScript 类型支持

------

## 安装

```ts
pnpm install @giszhc/generate-route-vue
```

或

```ts
npm install @giszhc/generate-route-vue
```

------

## 适用环境

- Vue 3
- Vue Router 4
- Vite

------

## 页面结构约定(推荐)

```ts
src / views /
├─ HomeView /
│  ├─ HomeView.vue
│  └─ page.ts
├─ UserView /
│  ├─ UserView.vue
│  └─ page.ts
```

------

## page.ts 示例

```ts
export default {
    title: "首页",
    redirect: {name: "home"}
};
```

`page.ts` 用于声明页面的路由元信息（`route.meta`）。

------

## API

### generateRoute(options)

动态生成 Vue Router 路由配置。

```ts
function generateRoute(options: IOption): RouteRecordRaw[];
```

------

### IOption 参数说明

```ts
import type {RouteRecordRedirectOption} from "vue-router";

interface IOption {
    pages: Record<string, unknown>;
    modules: Record<string, () => Promise<unknown>>;
    treeMode?: boolean;
    defaultRedirect: RouteRecordRedirectOption;
}
```

| 参数              | 类型                                     | 必填 | 说明       |
|-----------------|----------------------------------------|----|----------|
| pages           | Record<string, unknown>                | ✅  | `page.ts |page.js` 模块集合 |
| modules         | Record<string, () => Promise<unknown>> | ✅  | 页面组件模块集合 |
| treeMode        | boolean                                | ❌  | 是否生成树形路由 |
| defaultRedirect | RouteRecordRedirectOption              | ✅  | 根路径默认重定向 |

------

## 使用示例

### 基础用法

```ts
import {createRouter, createWebHistory} from "vue-router";
import generateRoute from "@giszhc/generate-route-vue";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: generateRoute({
        pages: import.meta.glob("@/views/**/page.ts", {eager: true}),
        modules: import.meta.glob("@/views/**/*.vue"),
        defaultRedirect: {name: "home"}
    })
});

export default router;
```

------

### 树形路由模式

```ts
routes: generateRoute({
    pages: import.meta.glob("@/views/**/page.ts", {eager: true}),
    modules: import.meta.glob("@/views/**/*.vue"),
    treeMode: true,
    defaultRedirect: {name: "home"}
})
```

#### 树形路由特点

- 自动根据目录结构生成父子路由
- 自动注入 `meta.pid` 标识父级关系
- 子路由使用相对路径（`name`）

------

## 路由生成规则

### 路由名称（name）

- 取组件目录名
- 自动移除 `View|-view`
- 自动转为小写

```ts
HomeView → home
UserCenterView → usercenter
home-view → home
user-center-view → user-center
```

------

### 路由路径（path）

- 基于 `views` 目录结构生成
- 自动移除 `View|-view`
- 自动转为小写

```ts
/views/us
erView / page.ts → /user
/views/us
er - view / page.ts → /user
```

------

## 默认重定向

根路径 `/` 自动注入重定向路由：

```json
{
  path: "/",
  redirect: defaultRedirect
}
```

------

## Tree Mode 与 Flat Mode 对比

| 模式               | 行为          |
|------------------|-------------|
| treeMode = false | 所有路由同级      |
| treeMode = true  | 按目录结构生成嵌套路由 |

------

## 注意事项

- 仅支持 Vite 的 `import.meta.glob`
- 页面必须包含 `page.ts|page.js`
- `page.ts|page.js` 必须使用 `default export`
- 路由结构强依赖目录命名规范
- 不支持运行时动态新增页面

------

## 适用场景

- 后台管理系统
- 多模块业务项目
- 约定式路由架构
- 希望减少路由维护成本的团队
