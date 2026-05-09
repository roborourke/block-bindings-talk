/**
 * Illustration Panel
 *
 * A sidebar panel that lets editors pick a custom illustration image and stores
 * it as post meta. This demonstrates using useEntityProp to read and write
 * post meta directly from the editor, and MediaUpload to open the media library.
 *
 * The stored meta keys (`illustration` and `illustration_url`) are registered
 * in plugin.php and can be bound to block attributes via the core/post-meta
 * binding source.
 */

import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEntityProp } from '@wordpress/core-data';
import { MediaUploadCheck, MediaUpload } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';

// Only show this panel for these post types.
const SUPPORTED_POST_TYPES = [ 'post', 'page' ];

function IllustrationPanel() {
	// Read the current post type so we can conditionally render the panel.
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);

	// useEntityProp returns a two-way binding to any field on the current post.
	// `meta` is the current meta object; `setMeta` merges changes into it and
	// marks the post as dirty (unsaved), so WordPress prompts to save.
	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	if ( ! SUPPORTED_POST_TYPES.includes( postType ) ) {
		return null;
	}

	const illustrationId  = meta?.illustration;
	const illustrationUrl = meta?.illustration_url;

	function onSelect( media ) {
		// Store both the attachment ID and URL. The ID alone is not directly
		// bindable to an image block's `url` attribute (which expects a string),
		// so we cache the URL separately for use in block bindings.
		setMeta( {
			...meta,
			illustration:     media.id,
			illustration_url: media.url,
		} );
	}

	function onRemove() {
		setMeta( {
			...meta,
			illustration:     0,
			illustration_url: '',
		} );
	}

	return (
		<PluginDocumentSettingPanel
			name="illustration-panel"
			title="Illustration"
		>
			{ /* MediaUploadCheck ensures the current user has the `upload_files`
			     capability before rendering the upload UI. */ }
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
							{ /* Use !! to coerce to boolean — `0 && <element>`
							     renders the literal "0" in React, not nothing. */ }
							{ !! illustrationId && (
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

// registerPlugin makes the component available to the editor. The `render`
// function is called once the editor initialises; returning null from a plugin
// render function is safe and simply renders nothing.
registerPlugin( 'block-bindings-illustration', {
	render: IllustrationPanel,
} );
