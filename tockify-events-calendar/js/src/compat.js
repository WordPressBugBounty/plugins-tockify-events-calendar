// backwards compatible dynamic import of wp.blockEditor (or wp.editor)
export let BlockControls, InspectorControls, InspectorAdvancedControls, BlockAlignmentToolbar;

const importEditor = async () => {
    const editor = await import('wp.blockEditor').then(mod => {
        if (!mod.BlockControls) {
            console.info("wp.blockEditor empty, using wp.editor");
            return import('wp.editor');
        }
        return mod;
    }).catch(err => {
        console.info("wp.blockEditor error, using wp.editor");
        return import('wp.editor');
    });
    BlockControls = editor.BlockControls;
    InspectorControls = editor.InspectorControls;
    InspectorAdvancedControls = editor.InspectorAdvancedControls;
    BlockAlignmentToolbar = editor.BlockAlignmentToolbar;
};

importEditor();

