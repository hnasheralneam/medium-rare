const ItemList = [
    {
        name: "tomato",
        src: (self) => {
            return self.attr("cutted") ? "tomato-sliced" : "tomato";
        },
        cuttable: true,
        type: "ingredient"
    },
    {
        name: "lettuce",
        src: (self) => {
            return self.attr("cutted") ? "lettuce-sliced" : "lettuce";
        },
        cuttable: true,
        type: "ingredient"
    },
    {
        name: "salad",
        src: (_) => "salad",
        cuttable: false,
        type: "meal"
    },
    {
        name: "steak",
        src: (_) => "steak",
        cuttable: false,
        type: "ingredient"
    },
    // containers (will contain an array of items)
    {
        name: "plate",
        src: (_) => "plate",
        cuttable: false,
        type: "container"
    },
    {
        name: "pot",
        src: (_) => "pot",
        cuttable: false,
        type: "container"
    }
];
const ItemMap = {};
for (const item of ItemList) {
    ItemMap[item.name] = item;
}

export const RecipeList = [
    {
        name: "salad",
        items: ["tomato", "lettuce"],
        check: ([tomato, lettuce]) => {
            if (tomato.attr("cutted") && lettuce.attr("cutted")) {
                return Item.fromName("salad");
            }
            return null;
        }
    }
];
export function findRecipe(name) {
    for (const recipe of RecipeList) {
        if (recipe.name === name) {
            return recipe;
        }
    }
    return null;
}

const RecipeMap = {};
for (const { items, check } of RecipeList) {
    RecipeMap[mangleNames(items)] = check;
}

function mangleNames(names) {
    const toSort = [...names];
    toSort.sort();
    return `${toSort.length}:${toSort.map(s => `<${s}>`).join("|")}`;
}

export const Recipes = {
    /** @param { Item[] } materials */
    using(...materials) {
        return RecipeMap[mangleNames(materials.map(item => item.proto.name))](materials);
    }
};

export class Item {
    constructor(proto) {
        this.proto = proto;
        this.data = {};
        if (this.proto.type == "container") this.items = [];
    }

    static fromId(id) {
        const proto = ItemList[id];
        if (proto === undefined) throw new Error(`Unknown item id ${id}`);
        return new Item();
    }

    static fromName(name) {
        const proto = ItemMap[name];
        if (proto === undefined) throw new Error(`Unknown item name ${name}`);
        return new Item(proto);
    }

    attr(prop) {
        return this.data[prop];
    }

    setAttr(prop, val) {
        this.data[prop] = val;
    }

    name() {
        return this.proto.name;
    }

    type() {
        return this.proto.type;
    }

    src() {
        return this.proto.src(this);
    }

    // containers!
    isContainer() {
        return this.proto.type == "container";
    }

    getItems() {
        return this.items;
    }

    addItem(item) {
        this.items.push(item);
        if (this.items.length == 2) {
            const result = Recipes.using(this.items[0], this.items[1]);
            if (result === null) return;
            this.items = [result];
        }
    }

    emptyContainer() {
        this.items = [];
    }
    isEmpty() {
        return this.items.length == 0;
    }
}

Item.prototype.toJSON = function() {
    const plain = {
        proto: { name: this.proto.name, type: this.proto.type },
        data: this.data
    };
    if (this.isContainer() && this.items) {
        plain.items = this.items.map(subItem => subItem.toJSON());
    }
    return plain;
};