function createQueue(size) {
    const data = Array(size).fill(null);
    let head = 0;
    let tail = 0;

    return {
        offer(a) {
            const next = (head + 1) % size;
            if (next === tail) return;
            data[head] = a;
            head = next;
        },
        poll() {
            if (this.empty) return null;
            const res = data[tail];
            data[tail] = null;
            tail = (tail + 1) % size;
            return res;
        },
        get size() {
            let diff = tail - head;
            if (diff < 0) diff += size;
            return diff;
        },
        get empty() {
            return head === tail;
        }
    }
}

export const Queue = {
    withSize(n) {
        return createQueue(n);
    }
};