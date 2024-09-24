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
        filemtime(plugin_dir_path(__FILE__) . 'js/bin/tockify.blocks.js')
    );

    register_block_type('tockify/tockify-events-calendar', array(
        'editor_script' => 'tockify_gutenberg',
    ));

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