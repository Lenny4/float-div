'use strict';
const $ = require('jquery');

const parentDivs = [];
$(window).on('resize', () => {
    for (let parent of parentDivs) {
        const reloadFloatIndex = parent.reloadFloatIndex;
        const currentReloadFloatIndex = getReloadFloatIndex(parent.reloadFloat);
        if (reloadFloatIndex !== currentReloadFloatIndex) {
            console.log(reloadFloatIndex, parent.reloadFloat[reloadFloatIndex]);
            FloatDiv(parent.target, parent.animation, parent.gridWidth, parent.reloadFloat);
            parent.reloadFloatIndex = currentReloadFloatIndex;
        }
    }
});

function registerParentFloatDiv(element, animation, gridWidth, reloadFloatIndex, reloadFloat) {
    let addParent = true;
    for (let parent of parentDivs) {
        if (element === parent.target) {
            element.animation = animation;
            element.gridWidth = gridWidth;
            element.reloadFloatIndex = reloadFloatIndex;
            element.reloadFloat = reloadFloat;
            addParent = false;
            break;
        }
    }
    if (addParent) {
        parentDivs.push({
            target: element,
            animation: animation,
            gridWidth: gridWidth,
            reloadFloatIndex: reloadFloatIndex,
            reloadFloat: reloadFloat,
            isCreating: true,
        });
    }
}

function getChildrenDiv(parentEl, gridWidth, containerWidth) {
    const result = [];
    $(parentEl).find('> *').each((indexChild, child) => {
        result.push({
            target: child,
            columnWidth: Math.round(gridWidth * ($(child).outerWidth() / containerWidth)),
            height: $(child).outerHeight(),
        })
    });
    return result;
}

function addLine(positions, line, gridWidth) {
    for (let column = 0; column < gridWidth; column++) {
        const array = [];
        for (let i = 0; i < gridWidth; i++) {
            array[i] = null;
        }
        positions[line] = array;
    }
}

function getNullColumnAvailable(positions, gridWidth, line) {
    const nullColumnAvailable = [];
    let objNull = {index: null, length: null};
    for (let i = 0; i < gridWidth; i++) {
        if (positions[line][i] === null && objNull.index === null) {
            objNull.index = i;
        }
        if (objNull.index !== null && (positions[line][i] !== null || i === (gridWidth - 1))) {
            objNull.length = 1 + i - objNull.index;
            nullColumnAvailable.push(JSON.parse(JSON.stringify(objNull)));
            objNull = {index: null, length: null};
        }
    }
    return nullColumnAvailable;
}

function getReloadFloatIndex(reloadFloat) {
    let reloadFloatIndex = 0;
    for (const w of reloadFloat) {
        if (w > $(window).width()) {
            break;
        }
        reloadFloatIndex++;
    }
    return reloadFloatIndex;
}

// reloadFloat: https://getbootstrap.com/docs/4.0/layout/grid/#grid-options
const FloatDiv = function (selector, animation = 400, gridWidth = 12, reloadFloat = [0, 576, 768, 992, 1200]) {
    // region init
    if (animation === 0 || isNaN(animation)) {
        animation = null;
    }
    const reloadFloatIndex = getReloadFloatIndex(reloadFloat);
    // endregion
    $(selector).each((i, e) => registerParentFloatDiv(e, animation, gridWidth, reloadFloatIndex, reloadFloat));
    for (let parent of parentDivs) {
        const containerWidth = $(parent.target).outerWidth();
        const positions = [];
        const heights = [];
        for (let i = 0; i < gridWidth; i++) {
            heights[i] = 0;
        }
        let line = 0;
        const childrenDiv = getChildrenDiv(parent.target, gridWidth, containerWidth);
        addLine(positions, line, gridWidth);
        const nbChildren = childrenDiv.length;
        for (let n = 0; n < nbChildren; n++) {
            // region get null column available
            let nullColumnAvailable = getNullColumnAvailable(positions, gridWidth, line);
            let addLineColumn = true;
            const smallestColumnHeight = Math.min(...heights);
            for (let objNull of nullColumnAvailable) {
                for (let i = objNull.index; i < (objNull.index + objNull.length); i++) {
                    if (heights[i] <= smallestColumnHeight) {
                        addLineColumn = false;
                        break;
                    }
                }
                if (addLineColumn === false) {
                    break;
                }
            }
            if (addLineColumn) {
                line++;
                addLine(positions, line, gridWidth);
                nullColumnAvailable = getNullColumnAvailable(positions, gridWidth, line);
            }
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
                        const child = childrenDiv[childIndex];
                        // region check if div on right is bigger
                        const myColumnHeight = heights[indexColumn];
                        let nextColumnHeight = null;
                        let upperElement = null;
                        if (Array.isArray(positions[line - 1])) {
                            let tempLine = line;
                            while (upperElement === null && tempLine > 0) {
                                upperElement = positions[tempLine - 1][indexColumn];
                                tempLine--;
                            }
                            if (upperElement !== null) {
                                for (let i = indexColumn; i < gridWidth; i++) {
                                    if (positions[line - 1][i] !== null && positions[line - 1][i].target !== upperElement.target) {
                                        nextColumnHeight = heights[i];
                                        break;
                                    }
                                }
                            }
                        }
                        // endregion
                        let changeColumn = true;
                        if (nextColumnHeight !== null && upperElement !== null) {
                            // region find smallest index column with enough width
                            let availableColumnIndexes = [];
                            for (let i = 0; i < gridWidth; i++) {
                                if (heights[i] < myColumnHeight) {
                                    availableColumnIndexes.push({
                                        columnIndex: i,
                                        height: heights[i],
                                    })
                                }
                            }
                            availableColumnIndexes = availableColumnIndexes.sort((prev, current) => {
                                if (prev.height < current.height) {
                                    return -1;
                                } else if (prev.height > current.height) {
                                    return 1;
                                } else {
                                    return 0;
                                }
                            });
                            // endregion
                            if (availableColumnIndexes.length > 0) {
                                for (let availableColumnIndex of availableColumnIndexes) {
                                    if (typeof nullColumnAvailable.find(x => x.index <= availableColumnIndex.columnIndex) !== 'undefined') {
                                        const thisColumnHeight = heights[availableColumnIndex.columnIndex];
                                        const to = availableColumnIndex.columnIndex + child.columnWidth;
                                        if (to > gridWidth) {
                                            break;
                                        }
                                        for (let i = availableColumnIndex.columnIndex; i < to; i++) {
                                            if (heights[availableColumnIndex.columnIndex] !== thisColumnHeight) {
                                                changeColumn = false;
                                                break;
                                            }
                                        }
                                        if (changeColumn) {
                                            indexColumn = availableColumnIndex.columnIndex;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (nextColumnHeight > myColumnHeight && !changeColumn) {
                                const newChildIndex = childrenDiv.findIndex(x => x.columnWidth <= upperElement.columnWidth);
                                if (newChildIndex !== -1) {
                                    childIndex = newChildIndex;
                                }
                            }
                        }
                        // endregion
                        break;
                    }
                }
                if (childIndex !== -1) {
                    if (positions[line][indexColumn] !== null) {
                        line++;
                        addLine(positions, line, gridWidth);
                    }
                    const child = childrenDiv[childIndex];
                    for (let i = 0; i < child.columnWidth; i++) {
                        if (i === 0) {
                            let height = heights[indexColumn];
                            for (let y = 0; y < child.columnWidth; y++) {
                                if (heights[indexColumn + y] > height) {
                                    height = heights[indexColumn + y];
                                }
                            }
                            positions[line][indexColumn] = {
                                target: child.target,
                                left: (indexColumn / gridWidth) * 100,
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
                    addLine(positions, line, gridWidth);
                    nullColumnAvailable = getNullColumnAvailable(positions, gridWidth, line);
                }
            }
            // endregion
        }
        for (let position of positions) {
            for (let el of position) {
                if (el !== null && el.top !== null) {
                    if (parent.animation === null) {
                        $(el.target).css('position', 'absolute').css('left', el.left + '%').css('top', el.top + 'px');
                    } else {
                        if (parent.isCreating) {
                            $(el.target).css('position', 'absolute').css('left', el.left + '%').css('top', el.top + 'px').hide().fadeIn(parent.animation);
                        } else {
                            $(el.target).css('position', 'absolute');
                            $(el.target).animate({left: el.left + '%', top: el.top + 'px'});
                        }
                    }
                    if (parent.isCreating) {
                        parent.isCreating = false;
                    }
                }
            }
        }
    }
};

module.exports = FloatDiv;
