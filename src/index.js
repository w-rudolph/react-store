var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    var Store = (function () {
        function Store(store, _moduleSeparator) {
            if (_moduleSeparator === void 0) { _moduleSeparator = "/"; }
            this._moduleSeparator = _moduleSeparator;
            this._observers = [];
            this._currentState = {};
            this._mutations = {};
            this._actions = {};
            this._moduleKeys = {};
            this._mutationHooks = [];
            this._resetStore(store);
        }
        Store.prototype.subscribe = function (observer) {
            var _this = this;
            this._assertFunc(observer, "Observer");
            this._observers.push(observer);
            return function () {
                _this._observers = _this._observers.filter(function (f) { return f !== observer; });
            };
        };
        Store.prototype.getState = function () {
            return this._currentState;
        };
        Store.prototype.dispatch = function (type, payload) {
            var _this = this;
            var action = this._actions[type];
            this._assertFunc(action, "Action");
            var moduleName = this._parseMoudleName(type);
            var currentState = this.getState();
            action({
                commit: function (subType, payload) {
                    _this.commit(moduleName
                        ? [moduleName, subType].join(_this._moduleSeparator)
                        : subType, payload);
                },
                state: moduleName ? currentState[moduleName] : currentState
            }, payload);
        };
        Store.prototype.commit = function (type, payload) {
            var mutation = this._mutations[type];
            this._assertFunc(mutation, "Mutation");
            var moduleName = this._parseMoudleName(type);
            var currentState = this.getState();
            var newState = __assign({}, currentState);
            if (moduleName) {
                newState[moduleName] = mutation(currentState[moduleName], payload);
            }
            else {
                newState = mutation({ state: currentState }, payload);
            }
            if (this._mutationHooks.length) {
                this._mutationHooks.forEach(function (hook) {
                    hook(type, payload);
                });
            }
            this._setState(newState);
        };
        Store.prototype.registerModule = function (moduleKey, storeModule) {
            if (this._moduleKeys[moduleKey]) {
                throw Error("Module '" + moduleKey + "' has been existed");
            }
            var store = { data: {}, modules: (_a = {}, _a[moduleKey] = storeModule, _a) };
            this._resetStore(store);
            var _a;
        };
        Store.prototype.unregisterModule = function (moduleKey) {
            if (!this._moduleKeys[moduleKey]) {
                return;
            }
            var newState = this.getState();
            delete newState[moduleKey];
            delete this._moduleKeys[moduleKey];
            this._setState(newState);
        };
        Store.prototype.addMutationHook = function (hook) {
            var _this = this;
            this._assertFunc(hook, "Mutation Hook");
            this._mutationHooks.push(hook);
            return function () {
                _this._mutationHooks = _this._mutationHooks.filter(function (h) { return h !== hook; });
            };
        };
        Store.prototype._resetStore = function (store) {
            var data = store.data, mutations = store.mutations, actions = store.actions, modules = store.modules;
            var parsedStore = this._parseModules(modules);
            this._mutations = __assign({}, this._mutations, mutations, parsedStore.mutations);
            this._actions = __assign({}, this._actions, actions, parsedStore.actions);
            var newState = __assign({}, this._currentState, data, parsedStore.data);
            this._setState(newState);
        };
        Store.prototype._setState = function (state) {
            this._currentState = __assign({}, this._currentState, state);
            this._notify();
        };
        Store.prototype._notify = function () {
            this._observers.forEach(function (observer) {
                observer();
            });
        };
        Store.prototype._assertFunc = function (fn, desc) {
            if (typeof fn !== "function") {
                throw Error(desc + " '" + fn + "' is not a function");
            }
        };
        Store.prototype._parseMoudleName = function (type) {
            var parsed = type.split(this._moduleSeparator);
            return parsed.length < 2 ? null : parsed[0];
        };
        Store.prototype._parseModules = function (modules) {
            var _this = this;
            if (modules === void 0) { modules = {}; }
            var keys = Object.keys(modules);
            var moduleState = {};
            var moduleMutations = {};
            var moduleActions = {};
            keys.forEach(function (key) {
                var _a = modules[key], _b = _a.data, data = _b === void 0 ? {} : _b, _c = _a.mutations, mutations = _c === void 0 ? {} : _c, _d = _a.actions, actions = _d === void 0 ? {} : _d;
                var mKeys = Object.keys(mutations);
                var aKeys = Object.keys(actions);
                moduleState[key] = data;
                _this._moduleKeys[key] = _this._moduleKeys[key] || {
                    mutations: [],
                    actions: []
                };
                mKeys.forEach(function (k) {
                    var saveKey = [key, k].join(_this._moduleSeparator);
                    _this._moduleKeys[key]["mutations"].push(saveKey);
                    moduleMutations[saveKey] = mutations[k];
                });
                aKeys.forEach(function (k) {
                    var saveKey = [key, k].join(_this._moduleSeparator);
                    _this._moduleKeys[key]["actions"].push(saveKey);
                    moduleActions[saveKey] = actions[k];
                });
            });
            return {
                data: moduleState,
                mutations: moduleMutations,
                actions: moduleActions
            };
        };
        return Store;
    }());
    exports.__esModule = true;
    exports["default"] = Store;
});
//# sourceMappingURL=index.js.map