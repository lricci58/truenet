/**
 * Creates an observer to check if an element (or multiple) with a specific class (either check-visibility or a specified one) is on screen after a specified delay.
 * If it is, it adds a class (or a list of classes) to it.
 * @param {any} options a key-value pair of options (queryID, delay, classList).
 */
function setupObserver(options) {
    const settings = {
        'queryID': '.check-visibility',
        'delay': 0.5,
        'classList': ['show'],
        ...options
    }

    const classList = [];

    if (!Array.isArray(settings['classList'])) classArray = settings['classList'].split(' ');
    else classArray = settings['classList'];

    for (const classKey in classArray) {
        const classAttr = classArray[classKey];
        if (classAttr) classList.add(classAttr);
    }

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: settings['delay'] });

    document.querySelectorAll(settings['queryID']).forEach(element => {
        observer.observe(element);
    });
}

export { setupObserver }