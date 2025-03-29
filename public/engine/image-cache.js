import { assets } from "./asset-list_AUTOGEN.js";

const data = {};

function getChecked(fullname) {
    if (data[fullname] === undefined) return ImageCache.placeholder();
    return data[fullname];
}


export const ImageCache = {
    getGlobal(name) {
        return getChecked(`global/${name}.png`);
    },
    getTile(name) {
        return getChecked(`tiles/${name}`);
    },
    getSprite(name, frame) {
        return getChecked(`sprites/${name}/${frame}.png`);
    },
    getItem(name) {
        return getChecked(`items/${name}.png`);
    },
    placeholder() {
        return data["global/placeholder.png"];
    },
    async init() {
        const imagesPre = assets.map(name => {
            const im = new Image();
            im.src = name;
            return new Promise((res, rej) => {
                im.onload = () => res(im);
            });
        });
        const images = await Promise.all(imagesPre);
        const bitmapsPre = images.map(im => window.createImageBitmap(im));
        try {
            (await Promise.all(bitmapsPre)).forEach((bitmap, i) => {
                data[assets[i]] = bitmap;
            });
        } catch {
            return false;
        }
        return true;
    }
};
