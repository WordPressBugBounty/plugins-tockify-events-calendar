/**
 * Created by derek on Wed 27 Feb 2019.
 */

import * as Styler from './styler';

const scrollEventKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
const wheelEvents = ['mousewheel', 'wheel', 'DOMMouseScroll', 'touchmove'];

const lockedPos = {};
const w = window;
const d = document;
let locked = false;


const addEventListener = (e, h) => d.addEventListener(e, h);
const removeEventListener = (e, h) => d.removeEventListener(e, h);


const makeBodyScrollable = () => {

  const htmlStyle = window.getComputedStyle(document.documentElement);
  const hy = htmlStyle['overflow-y'];

  if (hy !== 'auto' && hy !== 'scroll') {
    document.body.style.overflowY = 'scroll';
  }

};

export const disableScroll = () => {

  locked = true;

  Styler.hideScrollBar();

  const de = d.documentElement;
  const b = d.body;
  lockedPos.y = w.pageYOffset || de.scrollTop || b.scrollTop;
  lockedPos.x = w.pageXOffset || de.scrollLeft || b.scrollLeft;

  wheelEvents.forEach(we => addEventListener(we, handleWheel, false));

  addEventListener('scroll', handleScrollbar, false);

  addEventListener("keydown", handleKeydown, false);

};

export const enableScroll = () => {

  if (!locked) return;

  Styler.showScrollBar();

  wheelEvents.forEach(we => removeEventListener(we, handleWheel));

  removeEventListener('scroll', handleScrollbar);

  removeEventListener("keydown", handleKeydown);
};

const handleWheel = (e) => {
  console.log("SL: handleWheel");
  e.stopImmediatePropagation();
  e.preventDefault();
  e.returnValue = false;
  return false;
};

const handleKeydown = event => {
  if (scrollEventKeys.indexOf(event.keyCode) !== -1) {
    console.log("SL: handleKeydown");
    event.preventDefault();
  }
};

const handleScrollbar = () => {
  console.log("SL: handleScrollbar");
  window.scroll(lockedPos.x, lockedPos.y);
};
