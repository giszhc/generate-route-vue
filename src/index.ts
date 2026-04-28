import type {RouteRecordRaw, RouteRecordRedirectOption} from "vue-router";
import {type App, defineAsyncComponent} from "vue"

type Pages = Record<string, unknown>;
type Modules = Record<string, () => Promise<unknown>>;

interface IOption {
    pages: Pages;     // 页面集合
    modules: Modules;   // 模块集合
    treeMode?: boolean;   // 是否开启树形路由模式
    defaultRedirect: RouteRecordRedirectOption;   // 默认重定向路由
}

/**
 * 动态生成 Vue Router 路由配置
 * @param options - 路由配置选项
 * @param options.pages - page.ts/page.js 模块集合
 * @param options.modules - 页面组件模块集合
 * @param options.treeMode - 是否生成树形路由结构，默认为 false
 * @param options.defaultRedirect - 根路径的默认重定向目标
 * @returns 生成的路由配置数组
 */
export const generateRoute = (options: IOption): RouteRecordRaw[] => {
    const {pages, modules, treeMode, defaultRedirect} = options;

    // 生成同级目录的路由
    const generateSameLevelRoute = (): RouteRecordRaw[] => {
        const routes: RouteRecordRaw[] = [{path: "/", redirect: defaultRedirect}];

        Object.keys(pages).forEach(key => {
            // 获取page.ts文件父级目录名
            const name = key.split("/").slice(-2)[0];
            // @ts-ignore 拿到page.ts里面的meta信息
            const meta = pages[key].default;
            // 路由名称
            const routeName = name
                .replace(/View/g, "")
                .replace(/-view/g, "")
                .toLowerCase();
            // 拼接页面路径
            const componentPath = key
                .replace("page.ts", `${name}.vue`)
                .replace("page.js", `${name}.vue`);
            // 拼接路由路径
            const path = key
                .split("/")
                .slice(3)
                .slice(0, -1)
                .join("/")
                .replace(/View/g, "")
                .replace(/-view/g, "")
                .toLowerCase();
            // // 生成父级路由，方便后续生成树结构路由
            // const pid = path.split("/").slice(0, -1).join("/");

            routes.push({
                path: `/${path}`,
                name: routeName,
                redirect: meta.redirect,
                meta,
                // meta: {
                //     ...meta,
                //     pid: pid || "/"
                // },
                component: modules[componentPath],
            });
        });

        return routes;
    };

    // 根据同级路由生成树结构路由
    const generateTreeRoute = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
        const routeMap = new Map<string, RouteRecordRaw>();
        const tree: RouteRecordRaw[] = [];

        // ✅ 单独拿出根路由
        const rootRoute = routes.find(r => r.path === "/");

        const normalRoutes = routes.filter(r => r.path !== "/");

        // 建立完整路径映射
        normalRoutes.forEach(route => {
            routeMap.set(route.path, route);
        });

        normalRoutes.forEach(route => {
            const segments = route.path.split("/").filter(Boolean);

            // 一级目录
            if (segments.length === 1) {
                tree.push(route);
                return;
            }

            const parentPath = "/" + segments.slice(0, -1).join("/");
            const parent = routeMap.get(parentPath);

            if (parent) {
                parent.children ??= [];

                // 子路由改为相对路径
                route.path = segments[segments.length - 1];

                parent.children.push(route);
            } else {
                tree.push(route);
            }
        });

        // ✅ 把 "/" 放回最前面
        return rootRoute ? [rootRoute, ...tree] : tree;
    };

    const routes = generateSameLevelRoute();

    if (treeMode) {
        return generateTreeRoute(routes);
    }

    return routes;
};

// 首字母大写
const capitalizeFirstLetter = (str: string) => {
    str = str.replace(/-/g, "")
    return str.charAt(0).toUpperCase() + str.slice(1)
}

// 生成重命名（将连字符格式转换为驼峰格式）
const generateRename = (str: string) => {
    const split = str.split("-")
    const arr = [split[0]]
    for (let i = 1; i < split.length; i++) {
        arr.push(capitalizeFirstLetter(split[i]))
    }
    return arr.join("")
}

/**
 * 组件自动注册器 - 将组件列表中的组件自动注册为 Vue 应用的全局组件
 * @param app - Vue 应用实例
 * @param componentList - 通过 import.meta.glob 获取的组件模块集合
 * @param showLog - 是否在控制台输出组件导出语句列表，默认为 false
 */
export const ComponentAutoRegister = (app: App, componentList: any, showLog: boolean = false) => {
    const comList = []
    for (const fileName in componentList) {
        if (Object.hasOwn(componentList, fileName)) {
            const split = fileName.split("/")
            const componentName = split[split.length - 1].replace(".vue", "")
            const componentConfig = componentList[fileName]
            // 不能直接引入，vue3使用的是懒加载，参数是一个异步函数
            app.component(componentName, defineAsyncComponent(componentConfig))

            const name = capitalizeFirstLetter(generateRename(componentName))
            // @ts-ignore
            comList.push(`export {default as ${name} from '${fileName}'`)
        }
    }

    if (showLog) {
        console.log(comList)
    }
}

export default generateRoute;
