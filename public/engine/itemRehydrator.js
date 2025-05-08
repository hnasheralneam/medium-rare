import { Item } from "./item.js";

export function rehydrateItem(data) {
   let item = Item.fromName(data.proto.name);
   // restore attributes
   for (const [key, value] of Object.entries(data.data)) {
      item.setAttr(key, value);
   }

   if (data.proto.type === "container") {
      item.items = [];
      if (data.items) {
         data.items.forEach((obj) => {
            item.addItem(rehydrateItem(obj));
         });
      }
   }

   return item;
}