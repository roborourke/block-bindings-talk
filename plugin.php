<?php
/**
 * Plugin Name: Block Bindings For All
 */

add_action( 'init', function () : void {
    // Registered meta becomes available for bindings.
    register_meta(
        'post',
        'subheading',
        [
            'object_subtype' => 'post',
            'type' => 'string',
            'single' => true,
            'label' => 'Sub Heading',
            'description' => 'A subheading for the post',
            'show_in_rest' => true, // required.
        ]
    );

    // Works in templates.
    register_meta(
        'post',
        'illustration_url',
        [
            'object_subtype' => 'page',
            'type' => 'string',
            'single' => true,
            'label' => 'Illustration URL',
            'description' => 'An illustration URL for the page',
            'show_in_rest' => true,
        ]
    );

    register_meta(
        'post',
        'illustration_url',
        [
            'object_subtype' => 'post',
            'type' => 'string',
            'single' => true,
            'label' => 'Illustration URL',
            'description' => 'An illustration URL for the post',
            'show_in_rest' => true,
        ]
    );

    // Will not work out of the box in templates.
    register_meta(
        'post',
        'illustration',
        [
            'object_subtype' => 'page',
            'type' => 'number',
            'single' => true,
            'label' => 'Illustration ID',
            'description' => 'An illustration ID for the page',
            'show_in_rest' => true,
        ]
    );

    register_meta(
        'post',
        'illustration',
        [
            'object_subtype' => 'post',
            'type' => 'number',
            'single' => true,
            'label' => 'Illustration ID',
            'description' => 'An illustration ID for the post',
            'show_in_rest' => true,
        ]
    );

    register_block_bindings_source(
        'block-bindings-talk/featured-image-metadata',
        [
            'label'              => 'Featured Image Metadata',
            'get_value_callback' => function ( array $source_args, \WP_Block $block_instance ) : ?string {
                $post_id      = $block_instance->context['postId'] ?? null;
                $thumbnail_id = get_post_thumbnail_id( $post_id );
                if ( ! $thumbnail_id ) return null;
                $file = get_attached_file( $thumbnail_id );
                if ( ! $file ) return null;
                $meta = wp_read_image_metadata( $file );
                $key  = $source_args['key'] ?? null;
                return ( $key && isset( $meta[ $key ] ) ) ? (string) $meta[ $key ] : null;
            },
            'uses_context' => [ 'postId' ],
        ]
    );
} );

/**
 * Filters the content of a single block.
 *
 * @param string    $block_content The block content.
 * @param array     $block         The full block, including name and attributes.
 * @param \WP_Block $instance      The block instance.
 * @return string The block content.
 */
add_filter( 'render_block_core/image', function ( $block_content, $block, \WP_Block $instance ) {

    $block_content = var_export( $instance->context, true ) . $block_content;
    $block_content = var_export( $block['attrs'], true ) . $block_content;

    return $block_content;
}, 10, 3 );

/**
 * Register a custom post type called "book".
 *
 * @see get_post_type_labels() for label keys.
 */
function wpdocs_codex_book_init() {
	$labels = array(
		'name'                  => _x( 'Books', 'Post type general name', 'textdomain' ),
		'singular_name'         => _x( 'Book', 'Post type singular name', 'textdomain' ),
		'menu_name'             => _x( 'Books', 'Admin Menu text', 'textdomain' ),
		'name_admin_bar'        => _x( 'Book', 'Add New on Toolbar', 'textdomain' ),
		'add_new'               => __( 'Add New', 'textdomain' ),
		'add_new_item'          => __( 'Add New Book', 'textdomain' ),
		'new_item'              => __( 'New Book', 'textdomain' ),
		'edit_item'             => __( 'Edit Book', 'textdomain' ),
		'view_item'             => __( 'View Book', 'textdomain' ),
		'all_items'             => __( 'All Books', 'textdomain' ),
		'search_items'          => __( 'Search Books', 'textdomain' ),
		'parent_item_colon'     => __( 'Parent Books:', 'textdomain' ),
		'not_found'             => __( 'No books found.', 'textdomain' ),
		'not_found_in_trash'    => __( 'No books found in Trash.', 'textdomain' ),
		'featured_image'        => _x( 'Book Cover Image', 'Overrides the “Featured Image” phrase for this post type. Added in 4.3', 'textdomain' ),
		'set_featured_image'    => _x( 'Set cover image', 'Overrides the “Set featured image” phrase for this post type. Added in 4.3', 'textdomain' ),
		'remove_featured_image' => _x( 'Remove cover image', 'Overrides the “Remove featured image” phrase for this post type. Added in 4.3', 'textdomain' ),
		'use_featured_image'    => _x( 'Use as cover image', 'Overrides the “Use as featured image” phrase for this post type. Added in 4.3', 'textdomain' ),
		'archives'              => _x( 'Book archives', 'The post type archive label used in nav menus. Default “Post Archives”. Added in 4.4', 'textdomain' ),
		'insert_into_item'      => _x( 'Insert into book', 'Overrides the “Insert into post”/”Insert into page” phrase (used when inserting media into a post). Added in 4.4', 'textdomain' ),
		'uploaded_to_this_item' => _x( 'Uploaded to this book', 'Overrides the “Uploaded to this post”/”Uploaded to this page” phrase (used when viewing media attached to a post). Added in 4.4', 'textdomain' ),
		'filter_items_list'     => _x( 'Filter books list', 'Screen reader text for the filter links heading on the post type listing screen. Default “Filter posts list”/”Filter pages list”. Added in 4.4', 'textdomain' ),
		'items_list_navigation' => _x( 'Books list navigation', 'Screen reader text for the pagination heading on the post type listing screen. Default “Posts list navigation”/”Pages list navigation”. Added in 4.4', 'textdomain' ),
		'items_list'            => _x( 'Books list', 'Screen reader text for the items list heading on the post type listing screen. Default “Posts list”/”Pages list”. Added in 4.4', 'textdomain' ),
	);

	$args = array(
		'labels'             => $labels,
		'public'             => true,
		'publicly_queryable' => true,
		'show_ui'            => true,
		'show_in_menu'       => true,
		'query_var'          => true,
		'rewrite'            => array( 'slug' => 'book' ),
		'capability_type'    => 'post',
		'has_archive'        => true,
		'hierarchical'       => false,
		'menu_position'      => null,
		'supports'           => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' ),
	);

	register_post_type( 'book', $args );
}

add_action( 'init', 'wpdocs_codex_book_init' );

add_action( 'init', function() : void {
    register_post_meta(
        'post',
        'summary',
        [
            'type' => 'string',
            'show_in_rest' => true,
            'single' => true,
            'label' => 'Summary',
        ]
    );
} );

add_filter( 'get_post_metadata', function ( $value, int $object_id, string $meta_key, bool $single ) {
    if ( $meta_key === 'summary' ) {
        $summary = generate_summary( $object_id );
        return $single ? $summary : [ $summary ];
    }
    return $value;
}, 10, 4 );

function generate_summary( $id ) {
    return 'Dynamic summary!';
}

add_action( 'enqueue_block_editor_assets', function () : void {
    $asset_file = plugin_dir_path( __FILE__ ) . 'build/index.asset.php';

    if ( ! file_exists( $asset_file ) ) {
        return;
    }

    $asset = include $asset_file;

    wp_enqueue_script(
        'block-bindings-sidebar',
        plugin_dir_url( __FILE__ ) . 'build/index.js',
        $asset['dependencies'],
        $asset['version']
    );
} );
