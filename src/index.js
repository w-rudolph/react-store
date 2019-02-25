var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
export default class Store {
    constructor(store, _moduleSeparator = "/") {
        this._moduleSeparator = _moduleSeparator;
        this._observers = [];
        this._currentState = {};
        this._mutations = {};
        this._actions = {};
        this._moduleKeys = {};
        this._mutationHooks = [];
        this._resetStore(store);
    }
    subscribe(observer) {
        this._assertFunc(observer, "Observer");
        this._observers.push(observer);
        return () => {
            this._observers = this._observers.filter(f => f !== observer);
        };
    }
    getState() {
        return this._currentState;
    }
    dispatch(type, payload) {
        const action = this._actions[type];
        this._assertFunc(action, "Action");
        const moduleName = this._parseMoudleName(type);
        const currentState = this.getState();
        action({
            commit: (subType, payload) => {
                this.commit(moduleName
                    ? [moduleName, subType].join(this._moduleSeparator)
                    : subType, payload);
            },
            state: moduleName ? currentState[moduleName] : currentState
        }, payload);
    }
    commit(type, payload) {
        const mutation = this._mutations[type];
        this._assertFunc(mutation, "Mutation");
        const moduleName = this._parseMoudleName(type);
        const currentState = this.getState();
        let newState = __assign({}, currentState);
        if (moduleName) {
            newState[moduleName] = mutation(currentState[moduleName], payload);
        }
        else {
            newState = mutation({ state: currentState }, payload);
        }
        if (this._mutationHooks.length) {
            this._mutationHooks.forEach(hook => {
                hook(type, payload);
            });
        }
        this._setState(newState);
    }
    registerModule(moduleKey, storeModule) {
        if (this._moduleKeys[moduleKey]) {
            throw Error(`Module '${moduleKey}' has been existed`);
        }
        const store = { data: {}, modules: { [moduleKey]: storeModule } };
        this._resetStore(store);
    }
    unregisterModule(moduleKey) {
        if (!this._moduleKeys[moduleKey]) {
            return;
        }
        const newState = this.getState();
        delete newState[moduleKey];
        delete this._moduleKeys[moduleKey];
        this._setState(newState);
    }
    addMutationHook(hook) {
        this._assertFunc(hook, "Mutation Hook");
        this._mutationHooks.push(hook);
        return () => {
            this._mutationHooks = this._mutationHooks.filter(h => h !== hook);
        };
    }
    _resetStore(store) {
        const { data, mutations, actions, modules } = store;
        const parsedStore = this._parseModules(modules);
        this._mutations = __assign({}, this._mutations, mutations, parsedStore.mutations);
        this._actions = __assign({}, this._actions, actions, parsedStore.actions);
        const newState = __assign({}, this._currentState, data, parsedStore.data);
        this._setState(newState);
    }
    _setState(state) {
        this._currentState = __assign({}, this._currentState, state);
        this._notify();
    }
    _notify() {
        this._observers.forEach(observer => {
            observer();
        });
    }
    _assertFunc(fn, desc) {
        if (typeof fn !== "function") {
            throw Error(`${desc} '${fn}' is not a function`);
        }
    }
    _parseMoudleName(type) {
        const parsed = type.split(this._moduleSeparator);
        return parsed.length < 2 ? null : parsed[0];
    }
    _parseModules(modules = {}) {
        const keys = Object.keys(modules);
        const moduleState = {};
        const moduleMutations = {};
        const moduleActions = {};
        keys.forEach(key => {
            const { data = {}, mutations = {}, actions = {} } = modules[key];
            const mKeys = Object.keys(mutations);
            const aKeys = Object.keys(actions);
            moduleState[key] = data;
            this._moduleKeys[key] = this._moduleKeys[key] || {
                mutations: [],
                actions: []
            };
            mKeys.forEach(k => {
                const saveKey = [key, k].join(this._moduleSeparator);
                this._moduleKeys[key]["mutations"].push(saveKey);
                moduleMutations[saveKey] = mutations[k];
            });
            aKeys.forEach(k => {
                const saveKey = [key, k].join(this._moduleSeparator);
                this._moduleKeys[key]["actions"].push(saveKey);
                moduleActions[saveKey] = actions[k];
            });
        });
        return {
            data: moduleState,
            mutations: moduleMutations,
            actions: moduleActions
        };
    }
}
const instance = new Store({ data: {} });
export const store = {
    getState: instance.getState.bind(instance),
    dispatch: instance.dispatch.bind(instance),
    commit: instance.commit.bind(instance),
    registerModule: instance.registerModule.bind(instance),
    unregisterModule: instance.unregisterModule.bind(instance),
    subscribe: instance.subscribe.bind(instance),
    addMutationHook: instance.addMutationHook.bind(instance)
};
//# sourceMappingURL=index.js.map