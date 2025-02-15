const storageName = "medium-rare-save";

const saveDataRaw = {
    firstTime: true,
    highScore: 0
};
const saveDataHandler = {
    get(target, prop, _) {
        return target[prop];
    },
    set(target, prop, value) {
        target[prop] = value;
        localStorage.setItem(storageName, JSON.stringify(target));
        return true;
    }
}

init();

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

// export const Storage = (() => {
//     let saveData;
//     let firstTime = true;

//     let localSave = localStorage.getItem("mediumrareSave");
//     if (localSave) {
//         let saveCheck = JSON.parse(localSave);
//     if (!Object.is(saveCheck, null)) {
//         saveData = JSON.parse(localStorage.getItem("mediumrareSave"));
//         firstTime = false;
//     }
//     }
//     else {
//         saveData = saveInitial;
//         save();
//     }

//     function save() {
//         localStorage.setItem("mediumrareSave", JSON.stringify(save));
//     }

//     function isFirstTime() {
//         return firstTime;
//     }

//     return {
//         isFirstTime() { isFirstTime() },
//         save() { save() }
//     }
// })();