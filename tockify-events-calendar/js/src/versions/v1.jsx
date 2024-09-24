/*
  Version 1 embed code generator.
  Versions are isolated like this to simplify use of Gutenberg's 'deprecated' block feature.
 */

import classnames from "classnames";
// noinspection NpmUsedModulesInstalled
import {Fragment} from 'wp.element';

export const attributesDescriptor = {
  view: {
    type: 'string',
    default: ''
  },
  align: {
    type: 'string',
    default: ''
  },
  calendar: {
    type: 'string',
    default: ''
  },
  component: {
    type: 'string',
    default: 'calendar'
  },
  width: {
    type: 'number',
    default: undefined
  }
};


/**
 *
 * @param props
 * @returns Standard Tockify embed code <div> tag based on supplied properties.
 */
export const getCoreEmbedCode = (props) => {
  const {attributes: {view, calendar, component}} = props;

  if (!calendar || !component) return null;

  const unscopedEmbedProps = {
    component,
    calendar
  };

  if (view) {
    unscopedEmbedProps['view'] = view;
  }

  const embedProps = {};
  for (let k in unscopedEmbedProps) {
    embedProps['data-tockify-' + k] = unscopedEmbedProps[k];
  }

  return <div {...embedProps} />

};


/**
 * Gutenberg block specific embed code wrapper
 */
export const getEmbedCode = (props) => {
  const coreEmbedCode = getCoreEmbedCode(props);
  if (!coreEmbedCode) return null;
  const {attributes: {align, width}} = props;

  /* used  by gutenberg */
  const embedWrapperClasses = classnames({
    [`align${ align }`]: align,
    'is-resized': width,
  }) || false;

  const style = width && ({width: width + 'px'});

  return <Fragment>
    <div className={embedWrapperClasses} style={style}>
      {coreEmbedCode}
    </div>
  </Fragment>
};
