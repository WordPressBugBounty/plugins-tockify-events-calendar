/*
 Version 2 embed code generator.
 Versions are isolated like this to simplify use of Gutenberg's 'deprecated' block feature.
 */

const gtn_version = 2;

import classnames from "classnames";
// noinspection NpmUsedModulesInstalled
import {Fragment} from 'wp.element';

// attributes with the default value are omitted from the gutenberg block header
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
  maxEvents: {
    type: 'number',
    default: 0
  },
  tags: {
    type: 'array',
    default: undefined
  },
  extras: {
    type: 'array',
    default: undefined
  },
  width: {
    type: 'number',
    default: undefined
  }
};


/*
 *
 * @param props
 * @returns Standard Tockify embed code <div> tag based on supplied properties.
 */
export const getCoreEmbedCode = (props, preview) => {
  const {attributes: {component, calendar, view, maxEvents, tags, extras}} = props;

  if (!component || !calendar) return null;

  const unscopedEmbedProps = {
    component,
    calendar,
    gtn_version
  };

  // handle v1 setting view="Default From Theme"
  if (view && view.startsWith("Default")) {
    if (props.setAttributes) {
      console.info("V2: removing view='Default From Theme'");
      props.setAttributes({view: ''});
    }
  }

  if (view && !view.startsWith("Default")) {
    unscopedEmbedProps['view'] = view;
    if (view === 'agenda' || view === 'both') {
      unscopedEmbedProps['maxEvents'] = maxEvents || 3;
    }
  }

  if (preview) {
    // stop preview switching to narrow view (default is 667)
    unscopedEmbedProps['narrowwidth'] = 400;
  }

  if (tags && tags.length > 0) {
    unscopedEmbedProps['tags'] = tags.join(',');
  }

  if (extras && extras.length > 0) {
    extras.forEach(x => {
      const kv = x.split('=', 2);
      if (kv.length > 1 && kv[0].match(/^[\w\d-]+$/)) {
        unscopedEmbedProps[kv[0]] = kv[1].replace(/^['"](.*)['"]$/, "$1");
      }
    })
  }

  const embedProps = {};
  for (let k in unscopedEmbedProps) {
    embedProps['data-tockify-' + k] = unscopedEmbedProps[k];
  }

  return <div {...embedProps} />;
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
  </Fragment>;
};
