const storageName = "medium-rare-save";

const saveDataRaw = {
    firstTime: true,
    highScore: 0
};
const saveDataHandler = {
    get(target, prop, _) {
        // for per-level scores, which are undefined by default
        if (target[prop] == null) {
            target[prop] = 0;
        }
        return target[prop];
    },
    set(target, prop, value) {
        target[prop] = value;
        localStorage.setItem(storageName, JSON.stringify(target));
        return true;
    }
}

if (typeof window != "undefined" && !window.multiplayer) init();

export const SaveData = new Proxy(saveDataRaw, saveDataHandler);

function init() {
    const item = localStorage.getItem(storageName);
    if (item === null) return;
    const data = JSON.parse(item);
    for (const prop in data) {
        saveDataRaw[prop] = data[prop];
    }
}

export const clearSave = () => {
    localStorage.setItem(storageName, null);
    location.reload();
}
