/**
 * Custom Block Bindings Source – Featured Image Metadata (client-side)
 *
 * registerBlockBindingsSource() is the JavaScript counterpart to the PHP
 * register_block_bindings_source() call in plugin.php. Both registrations are
 * required:
 *
 *   PHP  → provides the value when the block is rendered on the front end
 *   JS   → provides the value inside the block editor (live preview)
 *
 * The source name must be identical on both sides.
 */

import { registerBlockBindingsSource } from '@wordpress/blocks';

/**
 * The EXIF/IPTC fields that WordPress stores when an image is uploaded.
 * Keys match what wp_read_image_metadata() returns (and what the REST API
 * exposes as media_details.image_meta).
 *
 * This map is shared between getValues (which needs the label as a fallback)
 * and getFieldsList (which builds the editor dropdown from it).
 */
const FIELDS = {
	aperture:          'Aperture',
	credit:            'Credit',
	camera:            'Camera',
	caption:           'Caption',
	created_timestamp: 'Created Timestamp',
	copyright:         'Copyright',
	focal_length:      'Focal Length',
	iso:               'ISO',
	shutter_speed:     'Shutter Speed',
	title:             'Title',
	orientation:       'Orientation',
};

registerBlockBindingsSource( {
	// Must match the name used in register_block_bindings_source() in plugin.php.
	name: 'block-bindings-talk/featured-image-metadata',

	// Human-readable label shown in the editor UI.
	label: 'Featured Image Metadata',

	// Declares that this source needs the postId context value. The editor
	// makes postId available inside query loops and templates; for a single-post
	// edit it reads from the currently open post automatically.
	usesContext: [ 'postId' ],

	/**
	 * getValues() is called by the editor whenever a bound block needs to
	 * display its current value. It receives:
	 *
	 *   select   – the @wordpress/data select function (read-only store access)
	 *   bindings – an object mapping each bound attribute to its source args,
	 *              e.g. { content: { source: '...', args: { key: 'caption' } } }
	 *
	 * It must return an object whose keys are attribute names and whose values
	 * are the resolved strings, e.g. { content: 'Photo by Jane Doe' }.
	 */
	getValues( { select, bindings } ) {
		// Read the featured image ID from the post currently open in the editor.
		const featuredImageId = select( 'core/editor' ).getEditedPostAttribute( 'featured_media' );
		if ( ! featuredImageId ) return {};

		// getMedia() returns undefined on the first call while the REST request
		// is in flight, then returns the media object once loaded. @wordpress/data
		// will re-run getValues automatically when the store updates.
		const media     = select( 'core' ).getMedia( featuredImageId );
		const imageMeta = media?.media_details?.image_meta ?? {};

		return Object.fromEntries(
			Object.entries( bindings ).map( ( [ attr, { args } ] ) => {
				const key   = args?.key;
				const value = key ? imageMeta[ key ] : undefined;

				// Fall back to the field label (e.g. "Caption") when no EXIF
				// value exists, so the block shows a meaningful placeholder in
				// the editor rather than appearing blank.
				return [ attr, value || FIELDS[ key ] || key ];
			} )
		);
	},

	/**
	 * canUserEditValue() controls whether the bound value is editable in the
	 * block editor. EXIF data is read-only (it comes from the image file), so
	 * we return false here. The block will appear locked in the editor.
	 */
	canUserEditValue() {
		return false;
	},

	/**
	 * getFieldsList() (WordPress 6.9+) returns the list of fields that appear
	 * in the Block Bindings UI dropdown when a user selects this source.
	 * Without this function the source is registered but invisible in the UI —
	 * bindings can still be set manually in block markup, but not via the picker.
	 *
	 * Each field object must have:
	 *   label – shown in the dropdown
	 *   type  – the expected value type ('string', 'integer', …)
	 *   args  – merged into the binding's `args` when the field is selected
	 */
	getFieldsList() {
		return Object.entries( FIELDS ).map( ( [ key, label ] ) => ( {
			label,
			type: 'string',
			args: { key },
		} ) );
	},
} );
