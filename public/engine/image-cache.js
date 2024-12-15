export const ImageCache = {
    data: {},
    get: async function(name) {
        if (this.data[name] === null) return this.get("placeholder.png");
        if (this.data[name] === undefined) {
            try {
                const image = new Image(32, 32);
                image.src = name;
                await image.decode();
                this.data[name] = await window.createImageBitmap(image);
            }
            catch (e) {
                console.log(name);
                this.data[name] = null;
                return null;
                //return this.get("placeholder.png");
            }
        }
        return this.data[name];
    }
};
