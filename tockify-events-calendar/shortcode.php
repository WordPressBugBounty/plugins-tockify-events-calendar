<?php

// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

function strict_attr_escape($value) {
    // Replace dangerous HTML entities that could decode into executable characters
	$value = preg_replace_callback('/&(?=quot;|apos;|lt;|gt;|#x?[0-9a-f]+;)/i',
    	function($matches) {
      		return '@'; // Replace '&' in entities with '@'
       	}, $value);
	// Then escape the rest normally
	return esc_attr($value);
}

function tockify_func($atts)
{
    $atts = array_merge(array(
        'calendar' => 'spirited',
        'component' => 'calendar'
    ), $atts);

    $embedstring = "<br><div";
    foreach ($atts as $key => $value) {
        // ignore unnamed attributes
        if (!is_int($key)) {
            $embedstring .= " data-tockify-" . esc_attr($key) . "=\"" . strict_attr_escape($value) . "\"";
        }
    }
    $embedstring .= "></div>";
    $embedstring .= "<script type='text/javascript'>";
    $embedstring .= "if (window._tkf && window._tkf.loadDeclaredCalendars) {";
    $embedstring .= "window._tkf.loadDeclaredCalendars();}</script>";
    return $embedstring;
}

add_shortcode('tockify', 'tockify_func');

?>
