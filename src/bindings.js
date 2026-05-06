import { registerBlockBindingsSource } from '@wordpress/blocks';

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
			Object.entries( bindings ).map( ( [ attr, { args } ] ) => [
				attr,
				imageMeta[ args?.key ] ?? '',
			] )
		);
	},
	canUserEditValue() {
		return false;
	},
} );
