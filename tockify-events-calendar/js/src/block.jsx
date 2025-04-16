// import gutenberg-supplied react elements
// noinspection NpmUsedModulesInstalled
import {__} from 'wp.i18n';
// noinspection NpmUsedModulesInstalled
import {registerBlockType} from 'wp.blocks';
// noinspection NpmUsedModulesInstalled
import {
  Button,
  ExternalLink,
  PanelBody,
  PanelRow,
  RangeControl,
  ResizableBox,
  SelectControl,
  Toolbar
} from 'wp.components';
// noinspection NpmUsedModulesInstalled
import {select} from 'wp.data';
// noinspection NpmUsedModulesInstalled
import {Component, Fragment, render} from 'wp.element';
// noinspection NpmUsedModulesInstalled
import {BlockAlignmentToolbar, BlockControls, InspectorAdvancedControls, InspectorControls} from './compat';


// https://react-select.com
import CreatableSelect from 'react-select/creatable';
import classnames from 'classnames';

import './tockifyBlocks.scss';
import {TockifyIcon} from './icon';
import {openFullScreen} from "./overlay";
import {updateCalendarSelect} from "./styler";
import {attributesDescriptor, getCoreEmbedCode, getEmbedCode} from "./versions/v2";
import * as v1 from "./versions/v1";

/* load any translations */
//setLocaleData(window['tockify_gutenberg'].localeData, 'tockify-events-calendar');

/**
 * @param align - gutenberg alignment value
 * @returns boolean whether or not to support resizing for this align value
 */
const getResizable = align => {
  const {isViewportMatch} = select('core/viewport');
  const isLargeViewport = isViewportMatch('>= large');
  return align && ['wide', 'full'].indexOf(align) === -1 && isLargeViewport;
};

/**
 * helper - reloads calendar after delay in case of dom render slowness (who knows where this will run).
 * @param ms - how long to wait
 * @returns
 */
const loadDeclaredAfter = ms => setTimeout(() => window._tkf.loadDeclaredCalendars(), ms);

/**
 * merges modified attributes into properties without breaking immutability
 * @param props
 * @param modifiedAttrs
 */
const mergeAttrs = (props, modifiedAttrs) => {
  const attributes = Object.assign({}, props.attributes, modifiedAttrs);
  return Object.assign({}, props, {attributes});
};

// Note: to use localhost embed you also need to change URL in scripts.php
const tkfBase = "https://tockify.com";
const apiBase = tkfBase;

let calOptions = [];
let tagOptions = [];
let calControl;

/**
 * get our calendars (if tockify cookie is set)
 */
const updateCalendars = () => {
  fetch(apiBase + '/api2/calendars?client=wp', {credentials: 'include'}).then(response => {
    response.json().then(json => {
      const calOpts = [];
      json.filter(cal => cal.status.name === 'online')
        .forEach(cal => calOpts.push({
          label: cal.name,
          value: cal.name,
          usingFreePlan: cal.effectiveFeatureLevel === 0,
          canonicalHost: cal.effectiveFeatureLevel === 200 ? cal.canonicalHost : ''
        }));
      calOpts.push({label: 'Tockify Demo', value: 'spirited'});
      calOptions = calOpts;

      if (calControl) {
        calControl.setCalOptions(calOpts);
      }
    });
  }).catch(e => {
    console.log("fetch calendars failed", e);
  });
};

// get available calendars early, so we know default calendar when editor is rendered
updateCalendars();


class CalControl extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    calControl = this;
  }

  componentDidMount = () => {
    updateCalendars();
  };

  setCalOptions = (calOpts) => {
    this.setState({calOpts});
  };

  render = () => {
    const {
      attributes: className, calName, onChange
    } = this.props;
    const calOpts = this.state.calOpts || [];

    return <CreatableSelect
        isClearable
        className={'wp_tkf_calendar_select ' + className}
        placeholder='Calendar short name'
        defaultValue={
          calName ? calOpts.find(c => c.value === calName) || {label: calName, value: calName} : undefined
        }
        onChange={onChange}
        options={calOpts}
        formatCreateLabel={val => 'Use short name: ' + val}
        isValidNewOption={input => input.match(/^[\w\d.]+$/)}
        noOptionsMessage={() => 'Invalid short code'}
        onMenuOpen={() => updateCalendars()}
    />
  }
}

let tagControl;
let extrasControl;

const updateTagOptions = (calendar, clear) => {
  if (tagControl) {
    tagControl.fetchTagOptions(calendar, clear);
  }

  if (clear && extrasControl) {
    extrasControl.select.select.clearValue();
  }
};

/**
 * stateful wrapper around tag control to ensure it updates when tag options change
 */
class TagControl extends Component {
  constructor(props) {
    super(props);
    this.state = {tagOptions};
    tagControl = this;
  }

  componentDidMount = () => {
    this.fetchTagOptions(this.props.attributes.calendar);
  };

  creatableRef = undefined;

  fetchTagOptions = (calendar, clear) => {
    fetch(apiBase + '/api/tagoptions/' + calendar + '?client=wp').then(response => {
      response.json().then(json => {
        tagOptions = [];
        json.tags.forEach(t => {
          tagOptions.push({value: t.text, label: t.text});
        });
        this.setState({tagOptions});

        if (clear && this.creatableRef) {
          this.creatableRef.select.select.clearValue();
        }
      })
    }).catch(e => {
      console.log("fetch tagoptions failed", e);
    });
  };

  render = () => {
    const {
      attributes: {tags}, tockifyBlock, className
    } = this.props;
    const tagOpts = this.state.tagOptions;

    return <CreatableSelect
      ref={ref => { this.creatableRef = ref; }}
      isClearable
      isMulti
      className={className}
      defaultValue={tags ? tags.map(t => ({value: t, label: t})) : undefined}
      options={tagOpts}
      onChange={tagv => {
        tagv = tagv || []
        tockifyBlock.updatePreviewWith(this.props, {tags: tagv.length > 0 ? tagv.map(t => t.value) : undefined})
      } }
      placeholder='Enter or select tags..'
      noOptionsMessage={() => 'No pre-defined tags'}
      formatCreateLabel={val => "Add tag: " + val}
    />
  }
}

/**
 * Tockify Gutenberg Block
 */
class TockifyBlock extends Component {
  title = __('Tockify Calendar', 'tockify-events-calendar');
  icon = TockifyIcon;
  category = 'widgets';
  attributes = attributesDescriptor;
  keywords = [__('calendar'), __('event'), __('events')];

  /**
   * Updates the Tockify calendar preview outside of the Gutenberg/React lifecycle.
   */
  updatePreview = (props, e) => {
    if (e) e.preventDefault();

    const {setAttributes, clientId} = props;
    const tmpcal = props.attributes.tmpcal;

    if (tmpcal) {
      const blockScope = document.querySelector('[data-block="' + clientId + '"]');
      const previewEl = blockScope.querySelector('.wp_tkf_preview');

      if (previewEl) {
        while (previewEl.firstChild) {
          previewEl.removeChild(previewEl.firstChild);
        }

        const el = getCoreEmbedCode(mergeAttrs(props, {calendar: tmpcal}), true);
        setTimeout(() => {
          const newDiv = document.createElement('div');
          previewEl.appendChild(newDiv);
          render(el, newDiv);
          [50, 100, 300, 500, 1000, 1500, 2000].forEach(loadDeclaredAfter);
        }, 10);
      }

      setAttributes({calendar: tmpcal});
    }
  };

  openOverlay = (url, props, e) => {
    if (e) e.preventDefault();
    openFullScreen({url});
  };

  /**
   * helper to update the preview with new attributes and setAttributes (avoids races)
   */
  updatePreviewWith = (props, attrs, e) => {
    if (e) e.preventDefault();
    const {setAttributes} = props;
    setAttributes(attrs);
    setTimeout(() => this.updatePreview(mergeAttrs(props, attrs)), 100);
  };

  // noinspection JSUnusedGlobalSymbols
  /**
   * used by Built in Align Toolbar
   * @param attributes
   * @returns {{"data-align": *, "data-resized": boolean}}
   */
  getEditWrapperProps = (attributes) => {
    const {align, width} = attributes;
    if ('left' === align || 'center' === align || 'right' === align || 'wide' === align || 'full' === align) {
      return {'data-align': align, 'data-resized': !!width};
    }
  };

  /**
   *
   * @param props
   * @returns Editor form and preview DOM nodes.
   */
  renderEditor = (props) => {

    //so the preview comes back when you edit visually
    loadDeclaredAfter(200);

    const {
      attributes: {calendar, tmpcal, extras},
      setAttributes
    } = props;

    let usingFreePlan;
    let calname;
    if (typeof tmpcal !== 'undefined') {
      calname = tmpcal;

      const calOption = calOptions.find(c => c.value === calname);

      usingFreePlan = calOption && calOption.usingFreePlan;

      const canonicalHost = calOption ? calOption.canonicalHost : undefined;

      if (canonicalHost) {
        if (!extras || !extras.find(e => e.startsWith('canonicalHost='))) {
          const newExtras = extras ? [...extras] : [];
          newExtras.push('canonicalHost=https://' + canonicalHost);
          setAttributes({extras: newExtras});
          if (extrasControl) {
            extrasControl.select.select.setValue(newExtras.map(t => ({value: t, label: t})));
          }
        }
      }
    } else {
      calname = calendar;
      setAttributes({tmpcal: calname});
      updateTagOptions(calname);

      if (!calname) {
        if (calOptions.length > 1) {
          calname = calOptions[0].value;
          usingFreePlan = !!calOptions.find(c => c.value === calname && c.usingFreePlan)
        }
        setTimeout(() => {
          if (calOptions.length > 1) {
            calname = calOptions[0].value;
            this.updatePreviewWith(props, {calendar: calname, tmpcal: calname});
            updateTagOptions(calname);
          }
        }, 100);
      }
    }

    setTimeout(() => updateCalendarSelect('Calendar short name'), 100);

    const calChanged = (calendar) => {
      const cal = calendar ? calendar.value : '';
      this.updatePreviewWith(props, {calendar: cal, tmpcal: cal, tags: undefined, extras: undefined, maxEvents: 0});
      updateTagOptions(cal, true);
      setTimeout(() => updateCalendarSelect('Calendar short name'), 100);
    };

    // noinspection JSXNamespaceValidation
    return (<Fragment>
      <form onSubmit={e => this.updatePreview(props, e)}>
        <div style={{width: "40px", height: "40px", display: 'inline-block'}}>{TockifyIcon}</div>
        <CalControl
          {...props}
          className='wp_tkf_calendar_select'
          calName={calname}
          onChange={calChanged}
        />
      </form>

      {!calendar && <div className='wp_tkf_accountMessage'>You need a Tockify Calendar to use this block.&nbsp;
        <ExternalLink href={tkfBase}>You can get one here</ExternalLink></div>}

      {usingFreePlan && <div className='wp_tkf_accountMessage'>You are using the free version of Tockify.&nbsp;
        <ExternalLink href={tkfBase + '/i/site/paidPlanPicker'}>Upgrade</ExternalLink> to get all the features.
      </div>
      }

      {calname &&
      <div className='wp_tkf_preview'>
        <div> {
          getCoreEmbedCode(props, true)
        } </div>
      </div>}

    </Fragment>)
  };

  //editor view
  edit = (props) => {
    const {
      attributes: {view, align, component, width, calendar, maxEvents, extras},
      isSelected, toggleSelection
    } = props;

    const handleClassName = 'wp_tkf_resizable-box__handle';

    const isResizable = getResizable(align);

    const loggedIn = !!calOptions.find(co => co.value === calendar);

    const site = tkfBase + (loggedIn ? '/' : '/i/site/login?next=');
    const customizer = component === 'mini' ? 'upcomingCustomizer' : 'customizer';
    const editLink = calendar && `${site}e/${calendar}`;
    const customizeLink = calendar && `${site}i/${customizer}/${calendar}`;

    return (<Fragment>
        <BlockControls>
          <Toolbar>
            <BlockAlignmentToolbar
              value={align}
              onChange={newAlign => {
                 // newAlign = newAlign || 'wide';
                 const newIsResizable = getResizable(newAlign);
                 const attrMods = {align: newAlign};
                 if (newIsResizable !== isResizable) {
                   attrMods.width = newIsResizable ? 400 : undefined
                 }
                 this.updatePreviewWith(props, attrMods)
              }}
            />
          </Toolbar>
        </BlockControls>
        <InspectorControls>
          <PanelBody>

            <SelectControl
              label={__('Calendar Style:')}
              className={'wp_tkf_inspector_select'}
              value={component}
              onChange={(component) => {
                this.updatePreviewWith(props, {component, view: undefined});
              }}
              options={[
                {value: 'calendar', label: 'Full Calendar'},
                {value: 'mini', label: 'Mini Calendar'}
              ]}
            />

            {(component === 'calendar') && (
              <PanelRow>
                <SelectControl
                  label={__('Full Calendar Layout:')}
                  className='wp_tkf_inspector_select'
                  value={view}
                  onChange={(view) => {
                    this.updatePreviewWith(props, {view})
                  }}
                  options={[
                    {value: '', label: 'Default From Theme'},
                    {value: 'pinboard', label: 'Pinboard'},
                    {value: 'agenda', label: 'Agenda'},
                    {value: 'monthly', label: 'Monthly'},
                  ]}
                />
              </PanelRow>
            )}
            {(component === 'mini') && (
              <PanelRow>
                <SelectControl
                  label={__('Mini Calendar Layout:')}
                  className='wp_tkf_inspector_select'
                  value={view}
                  onChange={(view) => {
                  const attrs = {view};
                  if (!view) attrs.maxEvents = 0;
                  this.updatePreviewWith(props, attrs)
                }}
                  options={[
                  {value: '', label: 'Default From Theme'},
                  {value: 'both', label: 'Monthly and Agenda'},
                  {value: 'monthly', label: 'Monthly Only'},
                  {value: 'agenda', label: 'Agenda Only'}
                ]}
                />
              </PanelRow>
            )}

            {(component === 'mini') && (view === 'both' || view === 'agenda') && (
              <RangeControl
                label={__('Maximum events to show')}
                value={maxEvents || 3}
                onChange={ maxEvents => this.updatePreviewWith(props, {maxEvents})}
                min={ 1 }
                max={ 30 }
              />
            )}

            <label className='wp_tkf_name_label'>{__('Only show events with these tags:')}</label>
            <PanelRow className='wp_tkf_tag_select'>
              <TagControl
                {...props}
                className='wp_tkf_inspector_select'
                tockifyBlock={this}
              />
            </PanelRow>

            { calendar && calendar !== 'spirited' &&
            <PanelRow>
              <ExternalLink href={editLink}>Edit Calendar</ExternalLink>
            </PanelRow>}
            { calendar && calendar !== 'spirited' &&
            <PanelRow>
              <ExternalLink href={customizeLink}>Customize Calendar</ExternalLink>
            </PanelRow>}
            { // leave space for tags dropdown
              calendar && calendar === 'spirited' &&
              <div style={{height: '50px'}}/>
            }

            { false && calendar !== 'spirited' &&
            <PanelRow>
              <Button wype="button" isLarge isDefault
                      onClick={(e) => this.openOverlay(editLink, props, e)}>Edit Events</Button>
              <Button wype="button" isLarge isDefault
                      onClick={(e) => this.openOverlay(customizeLink, props, e)}>Customize Calendar</Button>
            </PanelRow>
            }

          </PanelBody>
        </InspectorControls>

        <InspectorAdvancedControls>
          <label className='wp_tkf_name_label'>{__('Extra Embed Attributes')}</label>
          <PanelRow className='wp_tkf_tag_select'>
            <CreatableSelect
              className='wp_tkf_inspector_select'
              ref={ref => { extrasControl = ref; }}
              isClearable
              isMulti
              defaultValue={extras ? extras.map(t => ({value: t, label: t})) : undefined}
              options={[]}
              onChange={extrav => {
                extrav = extrav || []
                this.updatePreviewWith(props, {extras: extrav.length > 0 ? extrav.map(t => t.value) : undefined})
              } }
              placeholder='Enter Attributes'
              formatCreateLabel={val => "Add attribute: " + val}
              isValidNewOption={input =>
                /^[a-zA-Z_][\w.-]*=[^<>"'`=\\]+$/.test(input.trim())
              }
              noOptionsMessage={() => 'Enter name=value'}
            />
          </PanelRow>
        </InspectorAdvancedControls>

        <div className='wp_tkf_edit'>
          {
            isResizable && (
              <ResizableBox
                className={classnames( 'wp_tkf__resize-container', {'is-selected': isSelected} )}
                handleStyles={{}}
                handleClasses={{
                  top: classnames( handleClassName ),
                  right: classnames( handleClassName ),
                  bottom: classnames( handleClassName ),
                  left: classnames( handleClassName ),
                }}
                size={{ width }}
                //minHeight="50"
                minWidth='240'
                enable={{
                  top: false,
                  right: align !== 'right',
                  bottom: false,
                  left: align !== 'left',
                  topRight: false,
                  bottomRight: false,
                  bottomLeft: false,
                  topLeft: false,
                }}
                onResizeStop={(event, direction, elt, delta) => {
                  this.updatePreviewWith(props, {width: parseInt(width + delta.width, 10)});
                  toggleSelection(true);
                }}
                onResizeStart={() => {
                  toggleSelection(false);
                }}
              >
                {this.renderEditor(props)}
              </ResizableBox>)}
          {!isResizable && this.renderEditor(props)}
        </div>
      </Fragment>
    )
  };

  save = (props) => getEmbedCode(props);

  // Gutenberg saves block attributes in HTML comments.
  // It compares the saved output with save(props) from the current block version.
  // If they differ, it assumes the block is deprecated, and tries calling the deprecated save() functions.
  /*
   <!-- wp:tockify/tockify-events-calendar {"view":"pinboard","calendar":"wibble"} -->
   <div><div data-tockify-component="calendar" data-tockify-calendar="wibble" data-tockify-view="pinboard"></div></div>
   <!-- /wp:tockify/tockify-events-calendar -->
   */

  // https://wordpress.org/gutenberg/handbook/designers-developers/developers/block-api/block-deprecation/
  deprecated = [
    {
      attributes: v1.attributesDescriptor,
      save: (props) => {
        console.info("V1 save:", props); // info NOT removed by webpack
        return v1.getEmbedCode(props);
      }
    }
  ]
}

registerBlockType('tockify/tockify-events-calendar', new TockifyBlock());
