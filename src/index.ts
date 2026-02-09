import type {RouteRecordRaw, RouteRecordRedirectOption} from "vue-router";

type Pages = Record<string, unknown>;
type Modules = Record<string, () => Promise<unknown>>;

interface IOption {
    pages: Pages;     // 页面集合
    modules: Modules;   // 模块集合
    treeMode?: boolean;   // 是否开启树形路由模式
    defaultRedirect: RouteRecordRedirectOption;   // 默认重定向路由
}

// 动态生成路由
const generateRoute = (options: IOption): RouteRecordRaw[] => {
    const {pages, modules, treeMode, defaultRedirect} = options;

    // 生成同级目录的路由
    const generateSameLevelRoute = (modules: Modules, pages: Pages): RouteRecordRaw[] => {
        const routes: RouteRecordRaw[] = [{path: "/", redirect: defaultRedirect}];

        Object.keys(pages).forEach(key => {
            // 获取page.ts文件父级目录名
            const name = key.split("/").slice(-2)[0];
            // @ts-ignore 拿到page.ts里面的meta信息
            const meta = pages[key].default;
            // 路由名称
            const routeName = name.replace(/View/g, "").toLowerCase();
            // 拼接页面路径
            const componentPath = key.replace("page.ts", `${name}.vue`);
            // 拼接路由路径
            const path = key.split("/").slice(3).slice(0, -1).join("/").replace(/View/g, "").toLowerCase();
            // 生成父级路由，方便后续生成树结构路由
            const pid = path.split("/").slice(0, -1).join("/");

            routes.push({
                path: `/${path}`,
                name: routeName,
                redirect: meta.redirect,
                meta: {
                    ...meta,
                    pid: pid || "/"
                },
                component: modules[componentPath],
            });
        });

        return routes;
    };

    // 根据同级路由生成树结构路由
    const generateTreeRoute = (routes: RouteRecordRaw[]): RouteRecordRaw[] => {
        // 递归生成树结构
        const loopRoutes = (_routes: RouteRecordRaw[]): RouteRecordRaw[] => {
            for (const route of routes) {
                const paths = route.path.split("/").slice(1).filter(Boolean);
                if (paths.length > 1) {
                    for (const path of paths) {
                        // @ts-ignore 父级路由
                        const parentRoute = routes.find(_route => _route.name === path && route.meta?.pid?.endsWith(_route.name));
                        if (parentRoute) {
                            if (!parentRoute.children) {
                                parentRoute.children = [];
                            }
                            parentRoute.children.push(route);
                        }
                    }
                } else {
                    _routes.push(route);
                }
            }
            return _routes;
        };
        const _routesResult = loopRoutes([]);

        // 替换路由path
        const replatePath = (_routes: RouteRecordRaw[]): void => {
            for (const route of _routes) {
                if (route.meta && route.meta?.pid !== "/") {
                    route.path = route.name as string;
                }
                if (route.children) {
                    replatePath(route.children);
                }
            }
        };

        replatePath(_routesResult);

        return _routesResult;
    };

    const routes = generateSameLevelRoute(modules, pages);

    if (treeMode) {
        return generateTreeRoute(routes);
    }

    return routes;
};

export {
    generateRoute
}

export default generateRoute;
