'use strict';
const $ = require('jquery');

const parentDivs = [];

// is resizing: bool

function registerParentFloatDiv(element, animation) {
    let addParent = true;
    for (let parent of parentDivs) {
        if (element === parent.target) {
            element.animation = animation;
            addParent = false;
            break;
        }
    }
    if (addParent) {
        parentDivs.push({
            target: element,
            animation: animation,
        });
    }
}

function getChildrenDiv(parentEl, maxArrayWidth, windowWidth) {
    const result = [];
    $(parentEl).find('> *').each((indexChild, child) => {
        result.push({
            target: child,
            columnWidth: Math.round(maxArrayWidth * ($(child).outerWidth() / windowWidth)),
            height: $(child).outerHeight(),
        })
    });
    return result;
}

function addLine(positions, line, maxArrayWidth) {
    for (let column = 0; column < maxArrayWidth; column++) {
        const array = [];
        for (let i = 0; i < maxArrayWidth; i++) {
            array[i] = null;
        }
        positions[line] = array;
    }
}

function getNullColumnAvailable(positions, maxArrayWidth, line) {
    const nullColumnAvailable = [];
    let objNull = {index: null, length: null};
    for (let i = 0; i < maxArrayWidth; i++) {
        if (positions[line][i] === null && objNull.index === null) {
            objNull.index = i;
        }
        if (objNull.index !== null && (positions[line][i] !== null || i === (maxArrayWidth - 1))) {
            objNull.length = 1 + i - objNull.index;
            nullColumnAvailable.push(JSON.parse(JSON.stringify(objNull)));
            objNull = {index: null, length: null};
        }
    }
    return nullColumnAvailable;
}

const FloatDiv = function (selector, animation = 200, maxArrayWidth = 12) {
    // region init
    if (animation === 0) {
        animation = null;
    }
    const windowWidth = $(window).outerWidth();
    // endregion
    $(selector).each((i, e) => registerParentFloatDiv(e, animation));
    for (let parent of parentDivs) {
        const positions = [];
        const heights = [];
        for (let i = 0; i < maxArrayWidth; i++) {
            heights[i] = 0;
        }
        let line = 0;
        const childrenDiv = getChildrenDiv(parent.target, maxArrayWidth, windowWidth);
        addLine(positions, line, maxArrayWidth);
        const nbChildren = childrenDiv.length;
        for (let n = 0; n < nbChildren; n++) {
            // region get null column available
            let nullColumnAvailable = getNullColumnAvailable(positions, maxArrayWidth, line);
            // endregion
            // region find child to add
            let childIndex = -1;
            let indexColumn = -1;
            while (childIndex === -1) {
                for (const objNull of nullColumnAvailable) {
                    childIndex = childrenDiv.findIndex(x => x.columnWidth <= objNull.length);
                    if (childIndex !== -1) {
                        indexColumn = objNull.index;
                    }
                    if (childIndex !== -1) {
                        // region check if div on right is bigger
                        const myColumnHeight = heights[indexColumn];
                        let nextColumnHeight = null;
                        let upperElement = null;
                        if (Array.isArray(positions[line - 1])) {
                            upperElement = positions[line - 1][indexColumn];
                            for (let i = indexColumn; i < maxArrayWidth; i++) {
                                if (positions[line - 1][i] === null) {
                                    break;
                                } else if (positions[line - 1][i].target !== upperElement.target) {
                                    nextColumnHeight = heights[i];
                                    break;
                                }
                            }
                        }
                        if (nextColumnHeight !== null && nextColumnHeight > myColumnHeight && upperElement !== null) {
                            const newChildIndex = childrenDiv.findIndex(x => x.columnWidth <= upperElement.columnWidth);
                            if (newChildIndex !== -1) {
                                childIndex = newChildIndex;
                            }
                        }
                        // endregion
                        break;
                    }
                }
                if (childIndex !== -1) {
                    const child = childrenDiv[childIndex];
                    for (let i = 0; i < child.columnWidth; i++) {
                        if (i === 0) {
                            let height = heights[indexColumn];
                            for (let y = 0; y < child.columnWidth; y++) {
                                if (!isNaN(heights[indexColumn + y]) && heights[indexColumn + y] > height) {
                                    height = heights[indexColumn + y];
                                }
                            }
                            positions[line][indexColumn] = {
                                target: child.target,
                                left: (indexColumn / maxArrayWidth) * 100,
                                top: height,
                                columnWidth: child.columnWidth,
                            };
                        } else {
                            positions[line][indexColumn + i] = {
                                target: child.target,
                                left: null,
                                top: null,
                                columnWidth: null,
                            };
                        }
                        heights[indexColumn + i] += child.height;
                    }
                    childrenDiv.splice(childIndex, 1);
                } else {
                    line++;
                    addLine(positions, line, maxArrayWidth);
                    nullColumnAvailable = getNullColumnAvailable(positions, maxArrayWidth, line);
                }
            }
            // endregion
            // console.log(nullColumnAvailable);
        }
        for (let position of positions) {
            for (let el of position) {
                if (el !== null && el.top !== null) {
                    $(el.target).css('position', 'absolute').css('left', el.left + '%').css('top', el.top + 'px');
                }
            }
        }
        console.log(heights);
        console.log(positions);
    }
};

module.exports = FloatDiv;
