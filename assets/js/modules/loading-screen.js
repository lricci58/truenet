/**
 * -
 */
function show(time = 400) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.display = 'block';
    loadingScreen.style.transition = `opacity ${time}ms`;
    loadingScreen.style.opacity = '1';
}

/**
 * -
 */
function hide(time = 400) {
    const loadingScreen = document.getElementById('loading-screen');
    loadingScreen.style.transition = `opacity ${time}ms`;
    loadingScreen.style.opacity = '0';
    setTimeout(() => { // hide after fadeOut
        loadingScreen.style.display = 'none';
    }, time);
}

export { show, hide };