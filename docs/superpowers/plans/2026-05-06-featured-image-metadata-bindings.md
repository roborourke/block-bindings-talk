# Featured Image Metadata Block Bindings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Register a custom block bindings source that exposes IPTC/EXIF metadata from a post's featured image, with a matching editor sidebar panel showing available keys.

**Architecture:** PHP registers the server-side binding source using `register_block_bindings_source()` + `wp_read_image_metadata()`. A new `src/bindings.js` registers the client-side counterpart via `registerBlockBindingsSource()`, reading from the media store's `image_meta` field. `src/index.js` imports the bindings registration as a side effect and adds a `FeaturedImageMetadataPanel` component.

**Tech Stack:** PHP 8+, WordPress Block Bindings API (WP 6.5+), `@wordpress/blocks`, `@wordpress/editor`, `@wordpress/data`, `@wordpress/plugins`, `@wordpress/components`, `@wordpress/scripts` (build tool)

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `plugin.php` | Add `register_block_bindings_source()` inside existing `init` action |
| Create | `src/bindings.js` | Client-side `registerBlockBindingsSource()` registration |
| Modify | `src/index.js` | Add `import './bindings'`; add `FeaturedImageMetadataPanel` component + plugin registration |

---

## Task 1: PHP — Register the server-side binding source

**Files:**
- Modify: `plugin.php` (lines 6–74, the first `add_action( 'init', ... )` block)

- [ ] **Step 1: Add `register_block_bindings_source()` to `plugin.php`**

  Inside the existing first `add_action( 'init', function () : void {` block, after the last `register_meta()` call (before the closing `}`), add:

  ```php
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
  ```

  The complete first `init` action should end like:

  ```php
  add_action( 'init', function () : void {
      // ... existing register_meta() calls ...

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
  ```

- [ ] **Step 2: Verify no PHP syntax errors**

  ```bash
  php -l plugin.php
  ```

  Expected output:
  ```
  No syntax errors detected in plugin.php
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add plugin.php
  git commit -m "feat: register featured-image-metadata block bindings source"
  ```

---

## Task 2: JS — Create `src/bindings.js`

**Files:**
- Create: `src/bindings.js`

- [ ] **Step 1: Create `src/bindings.js`**

  Full file contents:

  ```js
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
  ```

  Notes:
  - `select( 'core' ).getMedia( id )` resolves asynchronously via the core data store — Gutenberg will re-run `getValues` automatically once the media object is available.
  - `canUserEditValue: () => false` keeps the bound attributes locked (not directly editable in the block toolbar).

- [ ] **Step 2: Build and verify no errors**

  ```bash
  npm run build
  ```

  Expected: build completes with no errors. `build/index.js` and `build/index.asset.php` are updated.

- [ ] **Step 3: Commit**

  ```bash
  git add src/bindings.js build/
  git commit -m "feat: register client-side featured-image-metadata bindings source"
  ```

---

## Task 3: JS — Add sidebar panel to `src/index.js`

**Files:**
- Modify: `src/index.js`

- [ ] **Step 1: Replace `src/index.js` with the updated version**

  The complete new file (existing `IllustrationPanel` is unchanged; new panel and import are added):

  ```js
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
  ```

- [ ] **Step 2: Build and verify no errors**

  ```bash
  npm run build
  ```

  Expected: build completes with no errors.

- [ ] **Step 3: Verify the build output includes both plugin registrations**

  ```bash
  grep -c "registerPlugin" build/index.js
  ```

  Expected output: `2` (one for each `registerPlugin` call).

- [ ] **Step 4: Commit**

  ```bash
  git add src/index.js build/
  git commit -m "feat: add FeaturedImageMetadataPanel sidebar panel"
  ```

---

## Manual Verification Checklist

After all tasks, test in the block editor (via `npm run playground:start` or a local WordPress install):

- [ ] Load the plugin and open a post with a featured image that has EXIF/IPTC metadata embedded
- [ ] Open the **Document Settings** sidebar — a "Featured Image Metadata" panel appears showing key/value pairs (e.g. `credit: Photographer Name`)
- [ ] Switch to Code Editor view and add a binding to a Paragraph block:
  ```json
  "metadata": {
    "bindings": {
      "content": {
        "source": "block-bindings-talk/featured-image-metadata",
        "args": { "key": "credit" }
      }
    }
  }
  ```
  Switch back to Visual Editor — the paragraph shows the photographer credit value
- [ ] Remove the featured image — the "Featured Image Metadata" panel disappears
- [ ] Set a featured image with no EXIF/IPTC — panel shows "No EXIF/IPTC metadata found in featured image."
- [ ] Verify the bound paragraph text is not directly editable in the block toolbar (locked)
