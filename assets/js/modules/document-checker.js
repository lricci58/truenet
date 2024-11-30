let readyState = false;

const documentChecker = {
    /**
     * -
     * @TODO add another check to the interval to resolve false (like a session fail)
     */
    isReady() {
        // return readyState;
        return new Promise((resolve) => {
            const intervalId = setInterval(() => {
                if (readyState) {
                    clearInterval(intervalId);
                    resolve(true);
                }
            }, 50);
        });
    },

    /**
     * -
     * @param {Boolean} newReadyState To set the new ready state
     */
    setReady(newReadyState = true) {
        readyState = newReadyState;
    }
}

Object.freeze(documentChecker);
export default documentChecker;