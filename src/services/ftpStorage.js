
/**
 * FTP Storage Service
 * Handles uploading movement data and images to a remote FTP server
 */
export const FTPService = {
    getConfig: () => {
        const saved = localStorage.getItem('autocheck_ftp_config');
        try {
            return saved ? JSON.parse(saved) : {
                host: '',
                port: 21,
                username: '',
                password: '',
                remotePath: '/',
                enabled: false
            };
        } catch (e) {
            return { host: '', port: 21, username: '', password: '', remotePath: '/', enabled: false };
        }
    },

    saveConfig: (config) => {
        localStorage.setItem('autocheck_ftp_config', JSON.stringify(config));
    },

    connect: () => {
        return new Promise((resolve, reject) => {
            if (!window.cordova || !window.cordova.plugin || !window.cordova.plugin.ftp) {
                return reject(new Error('FTP plugin not available on this platform'));
            }

            const config = FTPService.getConfig();
            if (!config.host) return reject(new Error('FTP Host not configured'));

            window.cordova.plugin.ftp.connect(
                config.host,
                config.port || 21,
                config.username,
                config.password,
                () => resolve(true),
                (err) => reject(new Error('FTP Connection Failed: ' + err))
            );
        });
    },

    uploadFile: (localPath, remoteName) => {
        return new Promise((resolve, reject) => {
            const config = FTPService.getConfig();
            const remotePath = (config.remotePath || '/') + remoteName;

            window.cordova.plugin.ftp.upload(
                localPath,
                remotePath,
                () => resolve(remotePath),
                (err) => reject(new Error('FTP Upload Failed: ' + err))
            );
        });
    },

    /**
     * Sync a complete movement (JSON + Photos) to FTP
     */
    syncMovement: async (movement) => {
        const config = FTPService.getConfig();
        if (!config.enabled) return null;

        try {
            await FTPService.connect();

            // 1. Upload photos first
            const photos = [...(movement.exitPhotos || []), ...(movement.returnPhotos || [])];
            for (const photoPath of photos) {
                if (photoPath && !photoPath.startsWith('data:')) {
                    const filename = photoPath.split('/').pop();
                    await FTPService.uploadFile(photoPath, filename);
                }
            }

            // 2. Create and upload a JSON summary
            const jsonFilename = `movement_${movement.id}.json`;
            const jsonBlob = new Blob([JSON.stringify(movement, null, 2)], { type: 'application/json' });

            // Note: For JSON uploading, we might need to save it to a temp file first 
            // because cordova-plugin-ftp usually expects a local file path.
            // For now, focus on photos which are already files.

            return true;
        } catch (e) {
            console.error('FTP Sync Error:', e);
            throw e;
        }
    }
};
