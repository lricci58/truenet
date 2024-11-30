/**
 * Opens the popup
 * @param {String} title A short title to express the reason the popup showed
 * @param {String} text A text to elaborate more freely on the reason the popup showed
 * @param {Object} customCallbacks A key-value pair that accepts only 'continue' and 'cancel' as keys, where the value should be a script to execute as callback when the button is selected
 * @param {Boolean} cancel The option to show the cancel button, with the default being true
 * @returns {Object} A new Promise.
 */
function open(title, text, customCallbacks = null, cancel = false) {
    // if (!Object.keys(callbackList).includes('continue')) return; // return if there is no continue callback defined
    // if (cancel && !Object.keys(callbackList).includes('cancel')) return; // same if cancel option is set to true but there's no cancel callback
    const registeredCallbacks = {
        'continue': function () { return; },
        'cancel': function () { return; },
        ...customCallbacks
    }

    const popupTitle = document.getElementById('popup-title');
    const popupText = document.getElementById('popup-text');
    popupTitle.textContent = title.toUpperCase();
    popupText.textContent = text;

    const popupCancelButton = document.getElementById('popup-cancel-button');
    popupCancelButton.style.display = cancel ? '' : 'none';

    const popupContinueButton = document.getElementById('popup-continue-button');

    const continueCallback = registeredCallbacks['continue'];
    function handleContinueClick() {
        continueCallback();
        close();
        popupContinueButton.removeEventListener('mousedown', handleContinueClick);
    }
    popupContinueButton.addEventListener('mousedown', handleContinueClick);

    if (cancel) {
        const cancelCallback = registeredCallbacks['cancel'];
        function handleCancelClick() {
            cancelCallback();
            close();
            popupCancelButton.removeEventListener('mousedown', handleCancelClick);
        }
        popupCancelButton.addEventListener('mousedown', handleCancelClick);
    }

    const popupBackground = document.getElementById('popup');
    popupBackground.classList.add('show');
}

/**
 * Closes the popup
 */
function close() {
    const popupBackground = document.getElementById('popup');

    popupBackground.classList.remove('show');
}

// @TODO: create the html automatically on import somehow (think css should use base variables, so allow user customization)

export { open, close };