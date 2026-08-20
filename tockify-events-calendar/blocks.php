<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

/**
 * Load all translations for our plugin from the MO file.
 */
add_action('init', 'tockify_load_textdomain');

function tockify_load_textdomain()
{
    load_plugin_textdomain('tockify-events-calendar', false, basename(__DIR__) . '/languages');
}

/**
 * Cache-busting version for a built asset: its mtime, or the plugin version if the
 * file is missing (an incomplete build should not raise a filemtime() warning).
 */
function tockify_asset_version($relative_path)
{
    $path = plugin_dir_path(__FILE__) . $relative_path;

    return file_exists($path) ? filemtime($path) : false;
}

/**
 * Registers all block assets so that they can be enqueued through Gutenberg in
 * the corresponding context.
 *
 * Passes translations to JavaScript.
 */
function tockify_events_calendar_register_block()
{
    //return;

    if (!function_exists('register_block_type')) {
        // Gutenberg is not active.
        return;
    }

    wp_register_script(
        'tockify_gutenberg',
        plugins_url('js/bin/tockify.blocks.js', __FILE__),
        array('wp-blocks', 'wp-i18n', 'wp-element', 'wp-editor', 'wp-components', 'wp-data'),
        tockify_asset_version('js/bin/tockify.blocks.js')
    );

    /*
     * The block's editor styles used to be injected into document.head by webpack's
     * style-loader, which since WP 7.1 is the wrong document: the editor canvas is an
     * iframe. Registering them as the block's editor_style hands the job to WordPress,
     * which puts the stylesheet in the canvas iframe (via _wp_get_iframed_editor_assets)
     * and on the outer editor page for the sidebar controls, but not on the front end.
     */
    wp_register_style(
        'tockify_gutenberg_css',
        plugins_url('js/bin/tockify.blocks.css', __FILE__),
        array(),
        tockify_asset_version('js/bin/tockify.blocks.css')
    );

    register_block_type('tockify/tockify-events-calendar', array(
        'editor_script' => 'tockify_gutenberg',
        'editor_style' => 'tockify_gutenberg_css',
    ));

    /*
     * Tell the block where Tockify lives, so the URLs are not hardcoded in the bundle
     * and a development site can point at a local host. See tockify_base_url().
     */
    wp_add_inline_script(
        'tockify_gutenberg',
        'window.tockifyConfig = ' . wp_json_encode(array(
            'baseUrl' => tockify_base_url(),
            'embedUrl' => tockify_embed_url(),
        )) . ';',
        'before'
    );

    /*
     * Pass already loaded translations to our JavaScript.
     *
     * This happens _before_ our JavaScript runs, afterwards it's too late.
     */
//    wp_add_inline_script(
//        'tockify_gutenberg',
//        sprintf(
//            'var tockify_gutenberg = { localeData: %s };',
//            json_encode(!function_exists('wp_get_jed_locale_data') ? gutenberg_get_jed_locale_data('tockify-events-calendar') : wp_get_jed_locale_data('tockify-events-calendar'))
//        ),
//        'before'
//    );

}

add_action('init', 'tockify_events_calendar_register_block');


?>