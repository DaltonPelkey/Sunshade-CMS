import { app, BrowserWindow, globalShortcut } from 'electron';
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
    mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    globalShortcut.register('CommandOrControl+R', function () {
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
