/**
 * Subheading Panel
 *
 * The simplest possible meta binding: a single text field that reads and writes
 * the `subheading` post meta key. The corresponding PHP registration is in
 * plugin.php, section 1.
 *
 * Once saved, the value can be bound to any supported block attribute using
 * the built-in core/post-meta source:
 *
 *   <!-- wp:paragraph {
 *     "metadata": {
 *       "bindings": {
 *         "content": { "source": "core/post-meta", "args": { "key": "subheading" } }
 *       }
 *     }
 *   } -->
 */

import { registerPlugin } from '@wordpress/plugins';
import { PluginDocumentSettingPanel } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useEntityProp } from '@wordpress/core-data';
import { TextControl } from '@wordpress/components';

function SubheadingPanel() {
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);

	const [ meta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );

	// The `subheading` meta key is only registered for the 'post' post type
	// (see plugin.php). Returning null hides the panel for pages and CPTs.
	if ( postType !== 'post' ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			name="subheading-panel"
			title="Subheading"
		>
			<TextControl
				label="Subheading"
				hideLabelFromVision={ true } // panel title already says "Subheading"
				value={ meta?.subheading ?? '' }
				onChange={ ( value ) =>
					setMeta( { ...meta, subheading: value } )
				}
			/>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'block-bindings-subheading', {
	render: SubheadingPanel,
} );
