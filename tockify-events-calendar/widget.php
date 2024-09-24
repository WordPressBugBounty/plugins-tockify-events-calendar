<?php
// If this file is called directly, abort.
if (!defined('WPINC')) {
    die;
}

class Tockify_Mini_Calendar_Widget extends WP_Widget
{

    function __construct()
    {

        parent::__construct(

            'register_minical_widget',

            __('Tockify Mini Calendar', 'tockify'),

            array(
                'description' => __(
                    'Tockify calendar for small spaces', 'tockify')
            )

        );

    }

    function form($instance)
    {

        $title = false;
        if (isset($instance['title'])) {
            $title = $instance['title'];
        }

        if (trim($title) == false) {
            $title = '';
        }

        $calendar = false;
        if (isset($instance['calendar'])) {
            $calendar = $instance['calendar'];
        }

        if (trim($calendar) == false) {
            $calendar = 'spirited';
        }

        $tags = false;
        if (isset($instance['tags'])) {
            $tags = $instance['tags'];
        }
        if (trim($tags) == false) {
            $tags = '';
        }

        // markup for form
        ?>
      <p>
        <label for="<?php echo $this->get_field_id('title'); ?>">Title</label>
        <input class="widefat" type="text" id="<?php echo $this->get_field_id('title'); ?>"
               name="<?php echo $this->get_field_name('title'); ?>" value="<?php echo esc_attr($title); ?>">
      </p>
      <p>
        <label for="<?php echo $this->get_field_id('calendar'); ?>">Your Calendar's Short Name</label>
        <input class="widefat" type="text" id="<?php echo $this->get_field_id('calendar'); ?>"
               name="<?php echo $this->get_field_name('calendar'); ?>" value="<?php echo esc_attr($calendar); ?>">
      </p>
      <p>
        <label for="<?php echo $this->get_field_id('tags'); ?>">Limit to events with these tags</label>
        <input class="widefat" placeholder="tag1,tag2" type="text" id="<?php echo $this->get_field_id('tags'); ?>"
               name="<?php echo $this->get_field_name('tags'); ?>" value="<?php echo esc_attr($tags); ?>">
      </p>


        <?php
    }

    function update($new_instance, $old_instance)
    {

        $instance = $old_instance;
        $instance['calendar'] = strip_tags($new_instance['calendar']);
        $instance['title'] = strip_tags($new_instance['title']);
        $instance['tags'] = strip_tags($new_instance['tags']);
        return $instance;

    }

    function widget($args, $instance)
    {

        extract($args);

        $title = false;
        if (isset($instance['title'])) {
            $title = $instance['title'];
        }

        if (trim($title) == false) {
            $title = '';
        }

        $calendar = false;
        if (isset($instance['calendar'])) {
            $calendar = $instance['calendar'];
        }

        if (trim($calendar) == false) {
            $calendar = 'spirited';
        }

        $tags = false;
        if (isset($instance['tags'])) {
            $tags = $instance['tags'];
        }

        if (trim($tags) == false) {
            $tags = '';
        }

        echo $before_widget;
        if ($title != false) {
            echo $before_title . $title . $after_title;
        }

        $tagsAttr = '';
        if ($tags != '') {
            $tagsAttr = 'data-tockify-tags="' . $tags . '"';
        }


        ?>
      <div data-tockify-component="upcoming"
           data-tockify-calendar="<?php echo $calendar ?>" <?php echo $tagsAttr ?>></div>
      <script type="text/javascript">
        if (window._tkf && window._tkf.loadDeclaredCalendars) {
          window._tkf.loadDeclaredCalendars();
        }
      </script>
        <?php

        echo $after_widget;
    }

}

?>
<?php
/*******************************************************************************
 * function tockify_register_minical_widget() - registers the widget.
 *******************************************************************************/
?>
<?php
function tockify_register_minical_widget()
{

    register_widget('Tockify_Mini_Calendar_Widget');

}

add_action('widgets_init', 'tockify_register_minical_widget');
?>