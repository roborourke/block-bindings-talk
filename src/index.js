/**
 * Block Bindings Talk – editor entry point.
 *
 * @wordpress/scripts bundles everything imported here into build/index.js,
 * which is enqueued by plugin.php on the `enqueue_block_editor_assets` hook.
 *
 * Each module below either registers a block bindings source or a sidebar
 * panel. Splitting them into separate files keeps each concept self-contained
 * and easy to read in isolation.
 */

// Register the custom block bindings source (client-side half).
// The server-side half lives in plugin.php, section 2.
import './bindings';

// Sidebar panels rendered in the Document Settings panel (right-hand sidebar).
import './panels/illustration';
import './panels/featured-image-metadata';
import './panels/subheading';
