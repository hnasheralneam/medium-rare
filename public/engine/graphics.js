const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

/*

             -height/2
                 ^        
                 |
                 |
-width/2 <-------+-------> +width/2
                 |
                 |
                 v
             +height/2

Origin at center of screen


*/

const MIN_PIX_COUNT = 256;

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const ratio = width / height;

    if (width >= height) {
        canvas.width = MIN_PIX_COUNT * ratio;
        canvas.height = MIN_PIX_COUNT;
    }
    else {
        canvas.width = MIN_PIX_COUNT;
        canvas.height = MIN_PIX_COUNT / ratio;
    }
}

handleResize();
window.addEventListener("resize", handleResize);
document.body.appendChild(canvas);


// Exports

export function drawImage(image, x, y) {
    const [dx, dy] = lastModifier();
    ctx.drawImage(image, x + Math.round(canvas.width / 2) + dx, y + Math.round(canvas.height / 2) + dy);
}

export function fillRect(x, y, w, h) {
    const [dx, dy] = lastModifier();
    ctx.fillRect(x + Math.round(canvas.width / 2) + dx, y + Math.round(canvas.height / 2) + dy, w, h);
}

export function setColor(color) {
    ctx.fillStyle = color;
}

export function clear(color="#000000") {
    const old = ctx.fillStyle;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = old;
}

export function width() { return canvas.width; }
export function height() { return canvas.height; }

const modifiers = [];

function lastModifier() {
    const res = modifiers[modifiers.length - 1];
    if (res === undefined) return [0, 0];
    return res;
}

export function pushModifier(x, y) {
    modifiers.push([x, y]);
}
export function restore() {
    modifiers.pop();
}