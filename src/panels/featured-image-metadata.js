/**
 * Featured Image Metadata Panel
 *
 * A read-only sidebar panel that displays the EXIF/IPTC metadata stored with
 * the post's featured image. This is useful for understanding what fields are
 * available to bind via the `block-bindings-talk/featured-image-metadata`
 * source registered in plugin.php and src/bindings.js.
 */

import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

function FeaturedImageMetadataPanel() {
	const imageMeta = useSelect( ( select ) => {
		// Get the attachment ID of the current featured image (0 if unset).
		const featuredImageId = select( editorStore ).getEditedPostAttribute( 'featured_media' );
		if ( ! featuredImageId ) return null;

		// getMedia() returns the cached media object if already loaded, or
		// undefined while the REST API request is in flight. @wordpress/data
		// will re-run this selector automatically once the request completes,
		// causing the component to re-render with the real data.
		const media = select( 'core' ).getMedia( featuredImageId );

		// media_details.image_meta contains the EXIF/IPTC fields that WordPress
		// extracted from the file when it was originally uploaded.
		return media?.media_details?.image_meta ?? null;
	}, [] );

	// Nothing to display until a featured image with metadata is available.
	if ( ! imageMeta ) return null;

	// Filter out empty or zeroed-out fields — many images have placeholder
	// values like "0" for aperture and shutter speed.
	const entries = Object.entries( imageMeta ).filter(
		( [ , v ] ) => v && v !== '0' && String( v ).length > 0
	);

	return (
		<PluginDocumentSettingPanel
			name="featured-image-metadata"
			title="Featured Image Metadata"
		>
			{ entries.length ? (
				entries.map( ( [ key, value ] ) => (
					<div key={ key } style={ { marginBottom: '4px' } }>
						<strong>{ key }</strong>: { String( value ) }
					</div>
				) )
			) : (
				<p>No EXIF/IPTC metadata found in featured image.</p>
			) }
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'block-bindings-featured-image-metadata', {
	render: FeaturedImageMetadataPanel,
} );
