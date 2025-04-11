/**
 * @typedef {{ setup: () => void, emitInput: () => void }} Comm
 */

/**
 * @param { View } view
 * @param { Comm } comm
 * @return { import("../globals").Client }
 */
function createClient(view, comm) {
    const keyListener = (e) => {
        if (e.key === "!") comm.emitInput("test");
    };

    comm.setup();
    document.addEventListener("keydown", keyListener);

    return {
        

        
    };
}

let created = false;
export const Client = {
    /**
     * @param { View } view
     * @param { Comm } comm
     */
    create: (view, comm) => {
        if (created) throw new Error("Clinet can only be created once");
        created = true;
        return createClient(view, comm);
    }
};