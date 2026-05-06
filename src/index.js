import './bindings';
import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEntityProp } from '@wordpress/core-data';
import { MediaUploadCheck, MediaUpload } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';

const SUPPORTED_POST_TYPES = [ 'post', 'page' ];

function IllustrationPanel() {
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);

	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	if ( ! SUPPORTED_POST_TYPES.includes( postType ) ) {
		return null;
	}

	const illustrationId = meta?.illustration;
	const illustrationUrl = meta?.illustration_url;

	function onSelect( media ) {
		setMeta( {
			...meta,
			illustration: media.id,
			illustration_url: media.url,
		} );
	}

	function onRemove() {
		setMeta( {
			...meta,
			illustration: 0,
			illustration_url: '',
		} );
	}

	return (
		<PluginDocumentSettingPanel
			name="illustration-panel"
			title="Illustration"
		>
			<MediaUploadCheck>
				<MediaUpload
					onSelect={ onSelect }
					allowedTypes={ [ 'image' ] }
					value={ illustrationId }
					render={ ( { open } ) => (
						<div>
							{ illustrationUrl && (
								<img
									src={ illustrationUrl }
									alt=""
									style={ {
										maxWidth: '100%',
										marginBottom: '8px',
										display: 'block',
									} }
								/>
							) }
							<Button onClick={ open } variant="secondary">
								{ illustrationId
									? 'Replace Illustration'
									: 'Select Illustration' }
							</Button>
							{ illustrationId && (
								<Button
									onClick={ onRemove }
									variant="link"
									isDestructive
									style={ { marginLeft: '8px' } }
								>
									Remove
								</Button>
							) }
						</div>
					) }
				/>
			</MediaUploadCheck>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'block-bindings-illustration', {
	render: IllustrationPanel,
} );

function FeaturedImageMetadataPanel() {
	const imageMeta = useSelect( ( select ) => {
		const featuredImageId = select( editorStore ).getEditedPostAttribute( 'featured_media' );
		if ( ! featuredImageId ) return null;
		const media = select( 'core' ).getMedia( featuredImageId );
		return media?.media_details?.image_meta ?? null;
	} );

	if ( ! imageMeta ) return null;

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
