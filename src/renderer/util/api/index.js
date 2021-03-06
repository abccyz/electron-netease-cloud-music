import debug from 'debug';
import { ipcRenderer } from 'electron';

const TAG = 'API';
const d = debug(TAG);

let resolveId = 0;

const methodMap = new Map();
const resolveMap = new Map();

ipcRenderer.on(TAG, (_, id, data) => {
    d('🔻 %d %o', id, data);
    if (resolveMap.has(id)) {
        resolveMap.get(id).call(null, data);
        resolveMap.delete(id);
    }
});

function senderFn(methodName, ...args) {
    resolveId++;
    return new Promise(resolve => {
        resolveMap.set(resolveId, resolve);
        ipcRenderer.send(TAG, methodName, resolveId, ...args);
        d('🔺 %d %s %o', resolveId, methodName, args);
    });
}

export default new Proxy({}, {
    get(_, propName) {
        if (methodMap.has(propName)) {
            return methodMap.get(propName);
        }
        const fn = senderFn.bind(null, propName);
        methodMap.set(propName, fn);
        return fn;
    }
});
