# Featured Image IPTC/EXIF Block Bindings — Design

**Date:** 2026-05-06

## Overview

Register a custom block bindings source (`block-bindings-talk/featured-image-metadata`) that exposes IPTC/EXIF metadata from a post's featured image as bindable values. Authors can bind block attributes (e.g. a paragraph's `content`, a heading's `content`, an image's `alt`) to metadata fields like photographer credit, caption, or copyright without manually copy-pasting.

A sidebar panel in the editor shows all non-empty metadata keys for the current featured image, so authors know which `key` values to use in their bindings.

## Architecture

Two files changed/created:

| File | Responsibility |
|---|---|
| `plugin.php` | Server-side binding source registration via `register_block_bindings_source()` |
| `src/bindings.js` | Client-side binding source registration via `registerBlockBindingsSource()` |
| `src/index.js` | Sidebar panel UI; imports `./bindings` for its side effect |

## PHP — `plugin.php`

Add inside the existing `init` action:

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

**Supported `key` values** (from `wp_read_image_metadata()`):
`title`, `caption`, `credit`, `copyright`, `camera`, `focal_length`, `iso`, `shutter_speed`, `aperture`, `created_timestamp`

(`keywords` returns an array and is excluded — not suitable for direct attribute binding.)

The callback re-reads from the image file on each render so it always reflects current file metadata. Returns `null` (no output) if: no featured image is set, the file cannot be found, or the requested key is missing/empty.

## JS — `src/bindings.js`

New file. Registers the client-side counterpart so the editor can resolve values during editing without a page reload:

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

`media_details.image_meta` is populated by `wp_read_image_metadata()` at upload time and is exposed by the `/wp/v2/media/{id}` REST endpoint — no custom REST endpoint needed. Values are read-only (`canUserEditValue` returns `false`).

## JS — `src/index.js`

Add at the top:

```js
import './bindings';
```

Add a new `FeaturedImageMetadataPanel` component and register it as a plugin alongside the existing `IllustrationPanel`:

```js
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

## Data Flow

```
Featured image set on post
    → /wp/v2/media/{id} (REST, cached in core store)
        → media_details.image_meta (JS editor)
        → wp_read_image_metadata( get_attached_file() ) (PHP render)
            → key lookup via source_args['key']
                → bound block attribute value
```

## Usage Example

In the block editor, a paragraph block can be bound to the photographer credit:

```json
{
    "metadata": {
        "bindings": {
            "content": {
                "source": "block-bindings-talk/featured-image-metadata",
                "args": { "key": "credit" }
            }
        }
    }
}
```

## Error Handling

- No featured image → binding returns `null` (block renders empty, no fatal error)
- File not found on disk → returns `null`
- Unknown key → returns `null`
- JS side: if media not yet loaded in store, `getValues` returns `{}` (Gutenberg retries when the selector resolves)

## Out of Scope

- Writing metadata back to the image file
- Exposing `keywords` (array type, incompatible with string attribute binding)
- Custom REST endpoint (not needed; `image_meta` is already in the media REST response)
