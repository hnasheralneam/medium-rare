export class Player {
    constructor() {
        this.item = null;
    }

    deleteItem() {
        this.item = null;
    }

    releaseItem() {
        const item = this.item;
        this.item = null;
        return item;
    }

    giveItem(item) {
        this.item = item;
    }
}