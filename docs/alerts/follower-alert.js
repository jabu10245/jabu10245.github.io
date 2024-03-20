const DELTA_TIME = 67;

window.addEventListener("load", () => {
    const animations = [];
    
    // Collect animations.
    const elements = document.getElementsByClassName("message");
    for (const element of elements) {
        collectElementAnimations(element).forEach(next => animations.push(next));
    }

    // Animate texts.
    animate(animations);
});

function collectElementAnimations(element) {
    const animations = [];

    for (const node of element.childNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
            collectElementAnimations(node).forEach(next => animations.push(next));
        } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue?.trim();
            if (!!text?.length) {
                animations.push(makeTextAnimation(node, " " + text));
            }
        }
    }

    return animations;
}

function makeTextAnimation(node, text) {
    node.nodeValue = " ";

    // Return node with empty text, and the desired final text.
    return { node, text };
}

function animate(animations) {
    if (animations.length > 0) {
        const next = animations[0];
        animateText(next, () => {
            animations.splice(0, 1);
            animate(animations);
        });
    }
}

function animateText(animation, completion) {
    const { node, text } = animation;
    const currentText = node.nodeValue;

    if (text === currentText) {

        // Complete animation.
        completion();
    } else {
        const index = currentText.length;
        const character = text[index];
        node.nodeValue += character;

        // Next animation frame.
        setTimeout(() => animateText(animation, completion), DELTA_TIME);
    }
}