<?php
/**
 * Plugin Name: Block Bindings For All
 *
 * A learning resource exploring the WordPress Block Bindings API.
 * Each section below demonstrates a different aspect of the API.
 */

// =============================================================================
// 1. Post Meta Registration
// =============================================================================
//
// Before a meta field can be used as a block binding it must be:
//   (a) registered via register_meta() / register_post_meta(), AND
//   (b) declared show_in_rest: true so the editor can read and write it.
//
// The `object_subtype` argument scopes a key to a specific post type,
// which lets you register the same key name for different types independently.

add_action( 'init', function () : void {

    // --- Subheading (posts only) ----------------------------------------------
    // A plain-text subheading. Scoped to 'post' so it won't appear on pages or
    // custom post types. The matching editor panel is in src/panels/subheading.js.
    register_meta(
        'post',
        'subheading',
        [
            'object_subtype' => 'post',
            'type'           => 'string',
            'single'         => true,
            'label'          => 'Sub Heading',
            'description'    => 'A subheading for the post',
            'show_in_rest'   => true, // required — without this the editor cannot read the value
        ]
    );

    // --- Illustration (posts and pages) ----------------------------------------
    // We store the attachment URL as a plain string so it can be bound directly
    // to an image block's `url` attribute. Storing the URL works well in
    // block templates because the binding value requires no further resolution.
    register_meta( 'post', 'illustration_url', [
        'object_subtype' => 'page',
        'type'           => 'string',
        'single'         => true,
        'label'          => 'Illustration URL',
        'show_in_rest'   => true,
    ] );

    register_meta( 'post', 'illustration_url', [
        'object_subtype' => 'post',
        'type'           => 'string',
        'single'         => true,
        'label'          => 'Illustration URL',
        'show_in_rest'   => true,
    ] );

    // We also store the attachment ID for more advanced use (e.g. generating
    // responsive srcsets). Note: a raw numeric ID cannot be bound directly to
    // an image block's `url` attribute — you would need a custom binding source
    // to resolve the ID to a URL first (see the featured-image-metadata source
    // in section 2 for an example of that pattern).
    register_meta( 'post', 'illustration', [
        'object_subtype' => 'page',
        'type'           => 'number',
        'single'         => true,
        'label'          => 'Illustration ID',
        'show_in_rest'   => true,
    ] );

    register_meta( 'post', 'illustration', [
        'object_subtype' => 'post',
        'type'           => 'number',
        'single'         => true,
        'label'          => 'Illustration ID',
        'show_in_rest'   => true,
    ] );

} );

// =============================================================================
// 2. Custom Block Bindings Source – Featured Image Metadata
// =============================================================================
//
// register_block_bindings_source() introduces a named source that any supported
// block can reference. When WordPress renders a bound block it calls
// `get_value_callback`, passing:
//
//   $source_args    – the `args` object from the block's binding definition,
//                     e.g. [ 'key' => 'caption' ]
//   $block_instance – the WP_Block being rendered, including its context
//
// The callback returns a string (or null to leave the attribute unchanged).
//
// `uses_context` declares which context values the callback needs access to.
// 'postId' is provided by single-post, query-loop, and template contexts —
// it identifies which post is currently being rendered.
//
// The JavaScript counterpart (src/bindings.js) registers the same source
// client-side so the editor can show live previews.

add_action( 'init', function () : void {

    register_block_bindings_source(
        'block-bindings-talk/featured-image-metadata',
        [
            'label'              => 'Featured Image Metadata',
            'uses_context'       => [ 'postId' ],
            'get_value_callback' => function ( array $source_args, \WP_Block $block_instance ) : ?string {

                $post_id      = $block_instance->context['postId'] ?? null;
                $thumbnail_id = get_post_thumbnail_id( $post_id );

                if ( ! $thumbnail_id ) {
                    return null;
                }

                // wp_get_attachment_metadata() retrieves the data WordPress
                // stored when the image was originally uploaded — no file I/O
                // on every request. The image_meta sub-array contains the same
                // EXIF/IPTC fields as wp_read_image_metadata(), but that
                // function is only available in admin contexts so we avoid it.
                $attachment_meta = wp_get_attachment_metadata( $thumbnail_id );
                $image_meta      = $attachment_meta['image_meta'] ?? null;

                if ( ! $image_meta ) {
                    return null;
                }

                // The `key` arg identifies which EXIF/IPTC field to return,
                // e.g. "caption", "camera", "copyright", "title".
                // The full list is defined in src/bindings.js → FIELDS.
                $key = $source_args['key'] ?? null;

                return ( $key && isset( $image_meta[ $key ] ) )
                    ? (string) $image_meta[ $key ]
                    : null;
            },
        ]
    );

} );

// =============================================================================
// 3. Dynamic Meta via Filter – Summary
// =============================================================================
//
// Post meta doesn't have to be stored in the database. By hooking into
// `get_post_metadata` we can return a computed value on the fly. Because the
// key is registered with show_in_rest: true, the REST API exposes it, and the
// core/post-meta binding source can use it just like any other meta field.
//
// Real-world uses: AI-generated summaries, aggregated field values,
// data pulled from an external API, computed reading-time estimates, etc.

add_action( 'init', function () : void {

    // Register the key so the REST API (and therefore block bindings) can see it.
    register_post_meta( 'post', 'summary', [
        'type'         => 'string',
        'show_in_rest' => true,
        'single'       => true,
        'label'        => 'Summary',
    ] );

} );

// Intercept every read of the `summary` key and return a dynamic value.
add_filter( 'get_post_metadata', function ( $value, int $object_id, string $meta_key, bool $single ) {
    if ( $meta_key !== 'summary' ) {
        return $value; // pass through for all other meta keys
    }

    $summary = generate_summary( $object_id );

    // WordPress passes $single = true when expecting one value, false for an
    // array of all values. The filter must honour the same convention.
    return $single ? $summary : [ $summary ];
}, 10, 4 );

/**
 * Generate a summary for the given post.
 * Replace this stub with real logic — an AI call, field concatenation, etc.
 */
function generate_summary( int $post_id ) : string {
    return 'Dynamic summary!';
}

// =============================================================================
// 4. Block Render Filter (debug helper)
// =============================================================================
//
// render_block_{block-name} fires when a specific block type is output on the
// front end. Uncomment either line below to inspect what data is available
// inside get_value_callback at render time — the block's context (postId,
// postType, queryId, …) and its raw block attributes are printed before the
// block's HTML.

add_filter( 'render_block_core/image', function ( string $block_content, array $block, \WP_Block $instance ) : string {

    // $block_content = var_export( $instance->context, true ) . $block_content;
    // $block_content = var_export( $block['attrs'],    true ) . $block_content;

    return $block_content;
}, 10, 3 );

// =============================================================================
// 5. Enqueue Editor JavaScript
// =============================================================================
//
// @wordpress/scripts produces an asset manifest (build/index.asset.php) listing
// the WordPress script handles our bundle depends on plus a content hash for
// cache-busting. Reading this file at runtime means the dependency list never
// goes stale as we add or remove imports.

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
