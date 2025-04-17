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
    ctx.drawImage(image, Math.round(x + canvas.width / 2) + dx, (Math.round(y + canvas.height / 2) + dy) - (image.height - 32));
}

// export function drawImageXOffset(image, x, y) {
//     const [dx, dy] = lastModifier();
//     ctx.drawImage(image, Math.round(x + canvas.width / 2) + dx, Math.round(y + canvas.height / 2) + dy);
// }

export function drawPlayer(image, x, y, sx, sy) {
    let imageSize = 32;
    const [dx, dy] = lastModifier();
    ctx.drawImage(image, imageSize * sx, imageSize * sy, imageSize, imageSize, Math.round(x + canvas.width / 2) + dx, Math.round(y + canvas.height / 2) + dy, imageSize, imageSize);
}
export function drawMirroredPlayer(image, x, y, sx, sy) {
    let imageSize = 32;
    const [dx, dy] = lastModifier();
    ctx.scale(-1, 1);
    ctx.drawImage(image, imageSize * sx, imageSize * sy, imageSize, imageSize, -Math.round(x + canvas.width / 2) - dx - 32, Math.round(y + canvas.height / 2) + dy, imageSize, imageSize);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function drawMirroredImage(image, x, y) {
    const [dx, dy] = lastModifier();
    ctx.scale(-1, 1);
    ctx.drawImage(image, -Math.round(x + canvas.width / 2) - dx - 32, Math.round(y + canvas.height / 2) + dy);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
}

export function drawProgressBar(remaining, total, x, y) {
    let progress = total - remaining;
    let progressPercent = progress / total;
    let progressBarProgress = progressPercent * 28; // width of progress bar

    const [dx, dy] = lastModifier();
    x = Math.round(x + canvas.width / 2) + dx;
    y = Math.round((y + 32) + canvas.height / 2) + dy - 4;
    let oldColor = ctx.fillStyle;
    ctx.fillStyle = "#999";
    ctx.fillRect(x + 2, y, 28, 4);
    ctx.fillStyle = "#00ff26";
    ctx.fillRect(x + 2, y, progressBarProgress, 4);
    ctx.fillStyle = oldColor;
}

export function drawText(text, x, y) {
    const [dx, dy] = lastModifier();
    ctx.font = "10px Pixelify Sans, sans-serif";
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#000";
    ctx.textAlign = "center";
    ctx.strokeText(text, Math.round(x + canvas.width / 2) + dx, Math.round(y + canvas.height / 2) + dy);
    ctx.fillText(text, Math.round(x + canvas.width / 2) + dx, Math.round(y + canvas.height / 2) + dy);
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