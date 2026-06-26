import { FileNode } from '../types.ts';
import { WebContainer } from '@webcontainer/api';

type LogCallback = (log: string) => void;

let webContainerInstance: WebContainer | null = null;

/**
 * Recursively creates the file structure within the WebContainer.
 */
const mountFiles = async (container: WebContainer, files: FileNode[], path = '/') => {
    for (const file of files) {
        const fullPath = `${path}${file.name}`;
        if (file.type === 'folder' && file.children) {
            await container.fs.mkdir(fullPath, { recursive: true });
            await mountFiles(container, file.children, `${fullPath}/`);
        } else if (file.type === 'file' && file.content) {
            await container.fs.writeFile(fullPath, file.content);
        }
    }
};

/**
 * Boots a WebContainer instance, mounts the project files, and runs the dev server.
 * @param files The project file tree.
 * @param onLog A callback to stream logs to the UI.
 * @returns The URL of the running application.
 */
export const deployToWebContainer = async (files: FileNode[], onLog: LogCallback): Promise<string> => {
    onLog('Iniciando instancia de WebContainer (esto puede tardar un momento)...');
    
    if (!webContainerInstance) {
        webContainerInstance = await WebContainer.boot();
        onLog('✅ Instancia iniciada.');
    } else {
        onLog('✅ Reutilizando instancia existente.');
    }

    onLog('Montando sistema de archivos virtual...');
    await mountFiles(webContainerInstance, files);
    onLog('✅ Archivos montados.');

    const installProcess = await webContainerInstance.spawn('npm', ['install']);
    onLog('Ejecutando `npm install`...');

    installProcess.output.pipeTo(new WritableStream({
        write(data) {
            onLog(data.trim());
        }
    }));
    
    const installExitCode = await installProcess.exit;
    if (installExitCode !== 0) {
        throw new Error('La instalación de dependencias falló. Revisa los logs.');
    }
    onLog('✅ Dependencias instaladas.');

    const startProcess = await webContainerInstance.spawn('npm', ['run', 'start']);
     onLog('Ejecutando `npm run start`...');
    
     startProcess.output.pipeTo(new WritableStream({
        write(data) {
            onLog(data.trim());
        }
    }));

    return new Promise((resolve) => {
        webContainerInstance!.on('server-ready', (port, url) => {
            onLog(`✅ Servidor listo en el puerto ${port}.`);
            resolve(url);
        });
    });
};

/**
 * Simulates a deployment to Netlify.
 * @param files The project file tree.
 * @param onLog A callback to stream logs to the UI.
 * @returns A fake Netlify URL.
 */
export const deployToNetlify = async (files: FileNode[], onLog: LogCallback): Promise<string> => {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    onLog('Iniciando despliegue simulado en Netlify...');
    await sleep(1000);
    onLog('Empaquetando proyecto...');
    await sleep(1500);
    onLog('Autenticando con la API de Netlify (simulado)...');
    await sleep(1000);
    onLog('Subiendo archivos...');
    await sleep(2000);
    onLog('Netlify está construyendo el sitio (build)...');
    await sleep(3000);

    const siteName = `ai-agent-site-${Date.now().toString().slice(-6)}`;
    const url = `https://${siteName}.netlify.app`;
    
    onLog(`✅ ¡Despliegue simulado completado!`);
    
    return url;
};