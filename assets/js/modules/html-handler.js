/**
 * -
 */
function createElement(elementType, innerText = null, attributes = null, classList = null, children = null, events = null) {
    const createdElement = document.createElement(elementType);

    if (attributes != null && attributes.constructor == Object) {
        for (const attributeKey in attributes) {
            const attributeValue = attributes[attributeKey];
            createdElement[attributeKey] = attributeValue;
        }
    }

    if (innerText != null) {
        if (innerText.includes('//')) createdElement.innerHTML = innerText.replace('//', '');
        else createdElement.textContent = innerText;
    }

    if (classList != null) addClasses(createdElement, classList);

    if (children != null) addChildren(createdElement, children);

    if (events != null) {
        for (const eventType in events) {
            const eventCallback = events[eventType];
            addEvent(createdElement, eventType, eventCallback);
        }
    }

    return createdElement;
}

/**
 * -
 */
function addChildren(parentElement, children, first = false) {
    if (!Array.isArray(children)) {
        if (first) {
            parentElement.insertBefore(children, parentElement.firstChild);
        } else {
            children = [children];
            for (const childKey in children) {
                const childElement = children[childKey];
                parentElement.appendChild(childElement);
            }
        }
    } else {
        for (const childKey in children) {
            const childElement = children[childKey];
            parentElement.appendChild(childElement);
        }
    }
}

/**
 * -
 */
function addClasses(element, classList) {
    if (!Array.isArray(classList)) classList = classList.split(' ');

    for (const classKey in classList) {
        const classAttr = classList[classKey];
        if (classAttr) element.classList.add(classAttr);
    }
}

/**
 * -
 */
function addEvent(element, eventType, eventCallback) {
    element.addEventListener(eventType, eventCallback);
}

/**
 * -
 */
function triggerEvent(element, eventType) {
    element.dispatchEvent(eventType);
}

export { createElement, addClasses, addEvent, triggerEvent };