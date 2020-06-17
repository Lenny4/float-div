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
        $(parent.target).find('> *').each((indexChild, child) => {
            const elWidthCategory = Math.round(maxArrayWidth * ($(child).outerWidth() / windowWidth)); // [1|2|3|4|5|6|7|8|9|10|11|12] if using bootstrap
            let line = 0;
            let positionFound = false;
            const heights = [];
            for (let i = 0; i < maxArrayWidth; i++) {
                heights[i] = 0;
            }
            while (positionFound === false) {
                const availableColumns = [];
                for (let column = 0; column < maxArrayWidth; column++) {
                    if (typeof positions[line] === 'undefined') {
                        const array = [];
                        for (let i = 0; i < maxArrayWidth; i++) {
                            array[i] = null;
                        }
                        positions[line] = array;
                    }
                    if (positions[line][column] !== null) {
                        heights[column] += $(positions[line][column].target).outerHeight();
                    }
                    // il faut tester les suivantes et voir quelles tailles est la plus petite
                    if (
                        positions[line][column] === null
                        && (column + elWidthCategory) <= maxArrayWidth
                    ) {
                        availableColumns.push({
                            index: column,
                            height: heights[column],
                            realColumnsHeight: 0,
                        });
                    }
                }
                if (availableColumns.length > 0) {
                    for (let availableColumn of availableColumns) {
                        for (let i = availableColumn.index; i < availableColumn.index + elWidthCategory; i++) {
                            if (heights[i] > availableColumn.realColumnsHeight) {
                                availableColumn.realColumnsHeight = heights[i];
                            }
                        }
                    }
                    const column = availableColumns.reduce((prev, current) => {
                        return (prev.realColumnsHeight <= current.realColumnsHeight) ? prev : current
                    });
                    for (let i = 0; i < elWidthCategory; i++) {
                        if (i === 0) {
                            positions[line][column.index + i] = {
                                target: child,
                                left: (column.index / maxArrayWidth) * 100,
                                top: column.realColumnsHeight,
                            };
                        } else {
                            positions[line][column.index + i] = {
                                target: child,
                                left: null,
                                top: null,
                            };
                        }
                    }
                    positionFound = true;
                }
                line++;
            }
        });
        for (let position of positions) {
            for (let el of position) {
                if (el !== null && el.top !== null) {
                    $(el.target).css('position', 'absolute').css('left', el.left + '%').css('top', el.top + 'px');
                }
            }
        }
        console.log(positions);
    }
};

module.exports = FloatDiv;
