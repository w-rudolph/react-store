type KeyValue<V> = {
  [propName: string]: V;
};

type StoreLike = {
  data: KeyValue<any>;
  mutations?: KeyValue<Function>;
  actions?: KeyValue<Function>;
  modules?: KeyValue<StoreLike>;
};

export default class Store {
  private _observers: Function[] = [];
  private _currentState: KeyValue<any> = {};
  private _mutations: KeyValue<Function> = {};
  private _actions: KeyValue<Function> = {};
  private _moduleKeys: KeyValue<any> = {};
  private _mutationHooks: Function[] = [];

  constructor(store: StoreLike, private _moduleSeparator: string = "/") {
    this._resetStore(store);
  }

  subscribe(observer: Function) {
    this._assertFunc(observer, "Observer");
    this._observers.push(observer);
    return () => {
      this._observers = this._observers.filter(f => f !== observer);
    };
  }

  getState() {
    return this._currentState;
  }

  dispatch(type: string, payload: any) {
    const action = this._actions[type];
    this._assertFunc(action, "Action");
    const moduleName = this._parseMoudleName(type);
    const currentState = this.getState();
    action(
      {
        commit: (subType: string, payload: KeyValue<any>) => {
          this.commit(
            moduleName
              ? [moduleName, subType].join(this._moduleSeparator)
              : subType,
            payload
          );
        },
        state: moduleName ? currentState[moduleName] : currentState
      },
      payload
    );
  }

  commit(type: string, payload: KeyValue<any>) {
    const mutation = this._mutations[type];
    this._assertFunc(mutation, "Mutation");
    const moduleName = this._parseMoudleName(type);
    const currentState = this.getState();
    let newState = { ...currentState };
    if (moduleName) {
      newState[moduleName] = mutation(currentState[moduleName], payload);
    } else {
      newState = mutation({ state: currentState }, payload);
    }
    if (this._mutationHooks.length) {
      this._mutationHooks.forEach(hook => {
        hook(type, payload);
      });
    }
    this._setState(newState);
  }

  registerModule(moduleKey: string, storeModule: StoreLike) {
    if (this._moduleKeys[moduleKey]) {
      throw Error(`Module '${moduleKey}' has been existed`);
    }
    const store = { data: {}, modules: { [moduleKey]: storeModule } };
    this._resetStore(store);
  }

  unregisterModule(moduleKey: string) {
    if (!this._moduleKeys[moduleKey]) {
      return;
    }
    const newState = this.getState();
    delete newState[moduleKey];
    delete this._moduleKeys[moduleKey];
    this._setState(newState);
  }

  addMutationHook(hook: Function) {
    this._assertFunc(hook, "Mutation Hook");
    this._mutationHooks.push(hook);
    return () => {
      this._mutationHooks = this._mutationHooks.filter(h => h !== hook);
    };
  }

  private _resetStore(store: StoreLike) {
    const { data, mutations, actions, modules } = store;
    const parsedStore = this._parseModules(modules);
    this._mutations = {
      ...this._mutations,
      ...mutations,
      ...parsedStore.mutations
    };
    this._actions = { ...this._actions, ...actions, ...parsedStore.actions };
    const newState = {
      ...this._currentState,
      ...data,
      ...parsedStore.data
    };
    this._setState(newState);
  }

  private _setState(state: KeyValue<any>) {
    this._currentState = { ...this._currentState, ...state };
    this._notify();
  }

  private _notify() {
    this._observers.forEach(observer => {
      observer();
    });
  }

  private _assertFunc(fn: Function, desc: string) {
    if (typeof fn !== "function") {
      throw Error(`${desc} '${fn}' is not a function`);
    }
  }

  private _parseMoudleName(type: string) {
    const parsed = type.split(this._moduleSeparator);
    return parsed.length < 2 ? null : parsed[0];
  }

  private _parseModules(modules: KeyValue<StoreLike> = {}) {
    const keys = Object.keys(modules);
    const moduleState = <KeyValue<any>>{};
    const moduleMutations = <KeyValue<any>>{};
    const moduleActions = <KeyValue<any>>{};
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
