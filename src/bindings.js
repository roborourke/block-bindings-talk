import { registerBlockBindingsSource } from '@wordpress/blocks';

const FIELDS = {
	aperture: 'Aperture',
	credit: 'Credit',
	camera: 'Camera',
	caption: 'Caption',
	created_timestamp: 'Created Timestamp',
	copyright: 'Copyright',
	focal_length: 'Focal Length',
	iso: 'ISO',
	shutter_speed: 'Shutter Speed',
	title: 'Title',
	orientation: 'Orientation',
};

registerBlockBindingsSource( {
	name: 'block-bindings-talk/featured-image-metadata',
	label: 'Featured Image Metadata',
	usesContext: [ 'postId' ],
	getValues( { select, bindings } ) {
		const featuredImageId = select( 'core/editor' ).getEditedPostAttribute( 'featured_media' );
		if ( ! featuredImageId ) return {};
		const media = select( 'core' ).getMedia( featuredImageId );
		const imageMeta = media?.media_details?.image_meta ?? {};
		return Object.fromEntries(
			Object.entries( bindings ).map( ( [ attr, { args } ] ) => {
				const key = args?.key;
				const value = key ? imageMeta[ key ] : undefined;
				return [ attr, value || FIELDS[ key ] || key ];
			} )
		);
	},
	canUserEditValue() {
		return false;
	},
	getFieldsList() {
		return Object.entries( FIELDS ).map( ( [ key, label ] ) => ( {
			label,
			type: 'string',
			args: { key },
		} ) );
	},
} );
