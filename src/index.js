import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from 'electron';
import handle from './js/handlers';
import path from 'path';
// import PDFWindow from 'electron-pdf-window';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

let mainWindow;
// let pdf;

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

    // pdf = new PDFWindow({
    //     width: 1000,
    //     height: 600,
    //     minWidth: 800,
    //     minHeight: 600,
    //     backgroundColor: '#e5e5e5',
    //     center: true
    // });

    mainWindow.loadURL(path.join('file://', __dirname, 'views', 'index.html'));
    // pdf.loadURL(path.join('file://', __dirname, 'tt.pdf'));
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    globalShortcut.register('CommandOrControl+R', () => {
        mainWindow.reload();
    });

    // dialog.showOpenDialog({ properties: ['openFile'] });
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
