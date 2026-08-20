<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}


function tockify_add_attribute($tag, $handle)
{
    if ('tockify_embed.js' !== $handle)
        return $tag;
    $tkf_tag = str_replace(' src=', ' data-cfasync="false" src=', $tag);
    if (get_option('tkf_script_async') == 1) {
        $tkf_tag = str_replace(' src=', ' async src=', $tkf_tag);
    }
    if (get_option('tkf_script_defer') == 1) {
        $tkf_tag = str_replace(' src=', ' defer src=', $tkf_tag);
    }
    return $tkf_tag;
}


/**
 * URL of the Tockify embed script.
 *
 * Define TOCKIFY_EMBED_URL in wp-config.php to point a development site at a
 * locally served embed script.
 */
function tockify_embed_url()
{
    return defined('TOCKIFY_EMBED_URL') ? TOCKIFY_EMBED_URL : 'https://public.tockify.com/browser/embed.js';
}

/**
 * Base URL of the Tockify site, used by the block for account links and the
 * calendar list API. Define TOCKIFY_BASE_URL in wp-config.php to override.
 */
function tockify_base_url()
{
    return defined('TOCKIFY_BASE_URL') ? TOCKIFY_BASE_URL : 'https://tockify.com';
}


function tockify_scripts()
{
    if (!wp_script_is('tockify', 'registered')) {
        wp_register_script('tockify', tockify_embed_url(), null, null, true);
    }
    wp_enqueue_script('tockify');
    add_filter('script_loader_tag', 'tockify_add_attribute', 10, 2);

    if (function_exists('wp_add_inline_script')) {

        wp_add_inline_script('tockify_embed.js', '
(function(history){
  if (history) {
    var pushState = history.pushState;
    history.pushState = function (state) {
      if (typeof history.onpushstate === "function") {
        history.onpushstate({state: state});
      }
      if (_tkf && _tkf.loadDeclaredCalendars) {
        for (var i = 0; i < 20; i++) {
          setTimeout(function () {
            _tkf.loadDeclaredCalendars();
          }, i * 100);
        }
      }
      return pushState.apply(history, arguments);
    }
  }
})(window.history);', 'after');
    }

}

// Front end. This is the only one of the two that exists before WP 5.0, so it stays
// for sites using just the shortcode or the widget on an older WordPress.
add_action('wp_enqueue_scripts', 'tockify_scripts');

/*
 * Since WP 7.1 the block editor canvas is always an iframe, built from the assets
 * collected by _wp_get_iframed_editor_assets(), which fires 'enqueue_block_assets'.
 * The block's preview markup lives in that iframe, so the embed script has to be
 * enqueued here to reach it — 'enqueue_block_editor_assets' only reaches the outer
 * editor page, where it can do nothing for the preview.
 */
if (function_exists('register_block_type')) {
    // Gutenberg is active.
    add_action('enqueue_block_assets', 'tockify_scripts');
}


?>
