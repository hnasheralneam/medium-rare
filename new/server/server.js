function createServer(comm) {


    return {
        handleInput(input) {
            console.info("server handling:", input);
        }
    }
}

export const Server = {
    create: (comm) => createServer(comm)
};