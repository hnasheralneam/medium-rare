const ItemList = [
    {
        name: "tomato",
        src: (self) => {
            return self.attr("cutted") ? "tomato-sliced" : "tomato";
        },
        cuttable: true,
    },
    {
        name: "lettuce",
        src: (self) => {
            return self.attr("cutted") ? "lettuce-sliced" : "lettuce";
        },
        cuttable: true,
    },
    {
        name: "salad",
        src: (_) => "salad",
        cuttable: false
    }
];
const ItemMap = {};
for (const item of ItemList) {
    ItemMap[item.name] = item;
}

const RecipeList = [
    {
        items: ["tomato", "lettuce"],
        check: ([tomato, lettuce]) => {
            if (tomato.attr("cutted") && lettuce.attr("cutted")) {
                return Item.fromName("salad");
            }
            return null;
        }
    }
];
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

    src() {
        return this.proto.src(this);
    }
}