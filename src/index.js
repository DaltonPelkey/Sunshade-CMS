import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from 'electron';
import handle from './js/handlers';
import path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let mainWindow;

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        backgroundColor: '#e5e5e5',
        center: true
    });
    mainWindow.setMenu(null);

    mainWindow.loadURL(path.join('file://', __dirname, 'views', 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('create-open-dialog', handle.createOpenDialog);
ipcMain.on('update-client', handle.updateClient);
ipcMain.on('fetch-all-clients', handle.fetchAllClients);
ipcMain.on('fetch-client', handle.fetchClient);
ipcMain.on('delete-client', handle.deleteClient);
ipcMain.on('download-file', handle.downloadFile);
ipcMain.on('delete-file', handle.deleteFile);
ipcMain.on('fetch-attachments', handle.fetchAttachments);
ipcMain.on('save-attachments', handle.saveAttachments);
ipcMain.on('show-message-box', handle.showMessageBox);
