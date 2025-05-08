import { rehydrateItem } from "./itemRehydrator.js";

export function rehydrateCell(cell) {
    const data = cell.data;
    if (data && data.item) {
        let item = rehydrateItem(data.item);
        data.item = item;
    }
    cell.data = data;
    return cell;
}