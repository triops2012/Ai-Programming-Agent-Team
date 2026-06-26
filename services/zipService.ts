import JSZip from 'jszip';
import saveAs from 'file-saver';
import { FileNode } from '../types.ts';

// Recursive function to add files and folders to the zip instance
const addFilesToZip = (zip: JSZip, nodes: FileNode[]) => {
    for (const node of nodes) {
        if (node.type === 'folder') {
            // Get or create a folder
            const folder = zip.folder(node.name);
            if (folder && node.children) {
                // Recurse into the children of the folder
                addFilesToZip(folder, node.children);
            }
        } else if (node.type === 'file' && typeof node.content === 'string') {
            // Add the file to the current folder in the zip
            zip.file(node.name, node.content);
        }
    }
};

/**
 * Creates a .zip file from a file tree structure and triggers a download.
 * @param fileTree - The array of FileNode objects representing the project structure.
 * @param projectName - The desired name for the downloaded .zip file (without extension).
 */
export const createAndDownloadZip = async (
    fileTree: FileNode[], 
    projectName: string = 'ai-generated-project'
): Promise<void> => {
    const zip = new JSZip();
    addFilesToZip(zip, fileTree);

    // Generate the zip file as a blob
    const blob = await zip.generateAsync({ type: 'blob' });

    // Trigger the download using file-saver
    saveAs(blob, `${projectName}.zip`);
};