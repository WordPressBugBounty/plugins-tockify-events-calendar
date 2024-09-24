/**
 * Created by derek on Wed 27 Feb 2019.
 */

let sheet;

const closeIconCSS = {
  normal: {
    'font-size': '28px',
    position: 'absolute',
    right: '10px',
    top: '7px',
    'color': 'white', // was '#333',
    cursor: 'pointer',
    display: 'block' // was 'none'
  },
  active: {
    'color': '#999'
  }
};

const overlayCSS = {
  position: 'fixed',
  // 'pointer-events': 'none',
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  'background-color': 'rgba(0,0,0,0.6)',
  width: '100%',
  height: '100%',
  'max-width': '100%',
  'max-height': '100%',
  zoom: 1,
  'z-index': 2147483647,
  margin: 0,
  padding: 0,
  border: 0,
  //tmp for ie
  opacity: 0,
};

const fadeCSS = {
  opacity: 1,
  transition: 'opacity 0.5s ease-in-out'
};

const clearCSS = {
  opacity: 1,
  'background-color': 'transparent'
};

const wrapCSS = {
  position: 'relative',
  margin: 0,
  padding: 0,
  height: '100%',
  'overflow-x': 'hidden'
};

const fullpageIFrameCSS = {
  background: 'white',
  'min-height': '95vh', // was 100vh
  border: 'none',
  width: '100%',
  position: 'absolute',
  overflow: 'hidden',
  left: 0,
  top: 0,
  bottom: 0,
  display: 'inline',
  margin: 0,
  padding: 0
};

const querySelector = (sel) => document.querySelector(sel);

const newSheet = () => {
  console.log("new sheet");

  const embedEl = querySelector('[tkfwp-embed="true"]');
  if (embedEl) {
    document.head.removeChild(embedEl);
  }
  const defensiveEl = querySelector('[tkfwp-defensive-style-tag="true"]');
  if (defensiveEl) {
    document.head.removeChild(defensiveEl);
  }

  // Create the <style> tag
  const style = document.createElement("style");
  style.setAttribute("tkfwp-embed", "true");
  style.setAttribute("data-noprefix", "");
  // WebKit hack :(
  style.appendChild(document.createTextNode(""));
  // Add the <style> element to the page
  document.head.appendChild(style);

  //append defensive style
  const defensiveStyle = document.createElement("style");
  defensiveStyle.setAttribute("tkfwp-defensive-style-tag", "true");
  document.head.appendChild(defensiveStyle);

  return style.sheet;
};

const jsonToCSS = (json, removeParentheses) => {
  const keys = Object.getOwnPropertyNames(json);
  keys.forEach(k => {
    const v = json[k];
    if (typeof v === 'string') {
      json[k] = v.replace(/,/g, '##');
    }
  });

  let css = JSON.stringify(json, null, 0).replace(/"/g, '').replace(/,/g, ';').replace(/##/g, ',');
  if (removeParentheses) {
    css = css.replace('{', '').replace('}', '');
  }
  return css;
};


const addCSSRule = (selector, rules, index) => {
  if (typeof index !== 'number') {
    index = 0;
  }
  return sheet.insertRule(selector + ' ' + jsonToCSS(rules), index);
};

let stylesInitialized;

export const initStyles = () => {
  if (!stylesInitialized) {
    console.log("initStyles");
    sheet = newSheet();
    addCSSRule('.tkfwp-overlay-ng', overlayCSS);
    addCSSRule('.tkfwp-overlay-ng.tkf-fade', fadeCSS);
    addCSSRule('.tkfwp-overlay-ng.tkf-clear', clearCSS);
    addCSSRule('.tkfwp-overlay-ng .tkfwp-close-icon', closeIconCSS.normal);
    addCSSRule('.tkfwp-overlay-ng .tkfwp-close-icon:hover, .tkfwp-overlay-ng .tkfwp-close-icon:active', closeIconCSS.active);

    addCSSRule('.tkfwp-wrap', wrapCSS, 0);
    addCSSRule('iframe.tkfwp-fullpage', fullpageIFrameCSS);
    addCSSRule('.tkfwp-overlay-ng .tkfwp-wordpress-nav', {width: '100%', height: '32px'});

    stylesInitialized = true;
  }

};

let addedViewPort = false;

export const addViewportIfMissing = () => {
  const vpEl = querySelector('meta[name="viewport"]');
  if (!vpEl) {
    document.head.insertAdjacentHTML('beforeend', '<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0">');
    addedViewPort = true;
  }
};

export const removeViewportIfAdded = () => {
  if (addedViewPort) {
    const vpEl = querySelector('meta[name="viewport"]');
    document.head.removeChild(vpEl);
    addedViewPort = false;
  }
};

const scrollbarWidth = () => {
  const scrollDiv = document.createElement("div");
  scrollDiv.style.cssText = 'width:100px;height:100px;overflow:scroll !important;position:absolute;top:-99999px';
  document.body.appendChild(scrollDiv);
  const result = scrollDiv.offsetWidth - scrollDiv.clientWidth;
  document.body.removeChild(scrollDiv);
  return result;
};

const isWindows = navigator.platform.indexOf('Win') > -1;

let hsbIndex = -1;

export const hideScrollBar = () => {
  if (!isWindows && scrollbarWidth() === 0) {
    return;
  }
  const isWebkit = 'WebkitAppearance' in document.documentElement.style;
  const ua = window.navigator.userAgent;
  const isIE = ua.indexOf('MSIE ') > 0 || ua.indexOf('Trident/') > 0 || ua.indexOf('Edge/') > 0;

  if (hsbIndex === -1) {
    if (isWebkit) {
      try {
        hsbIndex = addCSSRule('body::-webkit-scrollbar', {width: 0});
      } catch (e) {
        console.log("addRule error:", e);
      }
    } else if (isIE) {
      try {
        hsbIndex = addCSSRule('body', {'-ms-overflow-style': 'none'});
      } catch (e) {
        console.log("addRule error:", e);
      }
    }
  }
};

export const showScrollBar = () => {
  if (hsbIndex !== -1) {
    sheet.deleteRule(hsbIndex);
    hsbIndex = -1;
  }
};


// fix react-select cursor position
const newSelectSheet = () => {
  const embedEl = querySelector('[tkfwp-select="true"]');
  if (embedEl) {
    document.head.removeChild(embedEl);
  }

  // Create the <style> tag
  const style = document.createElement("style");
  style.setAttribute("tkfwp-select", "true");
  style.setAttribute("data-noprefix", "");
  // WebKit hack :(
  style.appendChild(document.createTextNode(""));
  // Add the <style> element to the page
  document.head.appendChild(style);

  return style.sheet;
};

let selectSheet;

const updateCSSRule = (selector, rules) => {
  if (!selectSheet) {
    selectSheet = newSelectSheet();
  }
  else {
    selectSheet.deleteRule(0);
  }
  selectSheet.insertRule(selector + ' ' + jsonToCSS(rules), 0);
};

export const updateCalendarSelect = (placeholder) => {
  const calContent = querySelector('.wp_tkf_calendar_select div div div');

  if (calContent && calContent.getBoundingClientRect) {
    const rect = calContent.getBoundingClientRect();
    const data = calContent.firstChild.data;

    let width = 0;
    if (data !== placeholder) {
      width = ~~rect.width;
    }

    updateCSSRule('.wp_tkf_calendar_select input', {
      left: width + 'px',
      position: 'relative'
    });
  }
};
