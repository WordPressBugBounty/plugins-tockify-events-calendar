/**
 * Created by derek on Wed 27 Feb 2019.
 */

import * as Scroller from "scrollcontrol";
import * as Styler from "./styler";

const querySelector = (sel) => document.querySelector(sel);
const getOverEl = () => querySelector('.tkfwp-overlay-ng');

const WINDOW_NAME_PREFIX = "tkfwp-client-window";

let ctr = 0;
const makeName = () => "fullcalendar-" + (++ctr);

const makeReg = separator => new RegExp('^' + WINDOW_NAME_PREFIX + '-' + separator + '-');

const WRAP_REGEX = makeReg('wrap');
const EMBED_REGEX = makeReg('embed');
const FULLSCREEN_REGEX = makeReg('fullscreen');
const OVERLAY_REGEX = makeReg('overlay');

const toBaseName = (name) => {
  if (!name) {
    name = makeName();
  }
  return name.replace(WRAP_REGEX, '').replace(EMBED_REGEX, '')
    .replace(FULLSCREEN_REGEX, '').replace(OVERLAY_REGEX, '')
};

const toName = (name, separator) => [WINDOW_NAME_PREFIX, separator, toBaseName(name)].join('-');

const toFullScreenName = name => toName(name, 'fullscreen');

export const openFullScreen = (args) => {
  const url = args.url;
  const fsguid = toFullScreenName('wordpress');

  Styler.initStyles();

  Styler.addViewportIfMissing();

  const body = document.body;

  body.insertAdjacentHTML('afterbegin',
    '<div class="tkfwp-overlay-ng tkf-fade">'
    + '<div class="tkfwp-wordpress-nav"></div>'
    + '<span class="tkfwp-close-icon">&#x2715;</span>'
    + '<div class="tkfwp-wrap">'
    + '<iframe name="' + fsguid + '" class="tkfwp-fullpage" src="' + url + '"></iframe>'
    + '</div>'
    + '</div>'
    + '</div>');

  try {
    Scroller.disableScroll();

    //temporary handlers so that if the fullscreen cal fails to appear
    //we can click to remove any overlay

    const overEl = getOverEl();
    const overElClickHandler = () => closeFullScreenHandler();

    overEl.addEventListener('click', overElClickHandler);

  } catch (e) {
    console.log("error booting fullscreen");
    closeFullScreenHandler();
  }

};

const closeFullScreenHandler = () => {
  console.log("run closer");
  Scroller.enableScroll();
  const overEl = getOverEl();
  if (overEl) {
    document.body.removeChild(overEl);
    Styler.removeViewportIfAdded();
  }
};
