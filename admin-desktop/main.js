const { app, BrowserWindow, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#f4eedd',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      spellcheck: false
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'login-select.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
