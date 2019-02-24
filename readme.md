`react-redux`开放了react状态管理的接口，只要按照接口，就能轻松实现react状态管理库
```
react-redux store API:
{
    dispatch,
    subscribe,
    getState()
}
```

`react-store`是依照`react-redux` API实现的一个状态管理库，参考了`Vuex`的结构

* `getState`获取最新状态
* `actions`执行异步操作，通过`dispatch`触发
* `mutations`执行同步操作，通过`commit`触发
* `registerModule`注册模块
* `unregisterModule`取消注册的模块

查看[代码实现](src/index.ts)
