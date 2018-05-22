export function randomIntFromInterval(min, max) {
    return Math.floor(Math.random()*(max-(min)+1)+(min));
};

export function randomFloatFromInterval(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2)
}

export function limitNumber(number, min, max) {
    return Math.min(Math.max(parseFloat(number), min), max);
}

export function getNormalizedValue(p, f, t) {
    return (p * (t - f)) + f;
}

export function getDimensions() {
    return {
        width: window.innerWidth,
        height: window.innerHeight,
    }
}

export function mapElems(elArr, onItem) {
    let arr = elArr.map(onItem);
    return arr;
}

export function nodesAsArray(nodeList) {
    return [].slice.call(nodeList);
}

export function isTouchDevice() {
    return 'ontouchstart' in window        // works on most browsers
    || navigator.maxTouchPoints;       // works on IE10/11 and Surface
}

export function getMq() {
    var medium = 1100,
        small = 800,
        xsmall = 640;

    return {
        medium: window.matchMedia(`(max-width: ${medium}px)`).matches,
        small: window.matchMedia(`(max-width: ${small}px)`).matches,
        xsmall: window.matchMedia(`(max-width: ${xsmall}px)`).matches
    };
}

// Converts from degrees to radians.
export function radians(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
export function degrees(radians) {
  return radians * 180 / Math.PI;
};