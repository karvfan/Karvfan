const { app, BrowserWindow, session, shell } = require('electron');
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
  const isWeb = (u) => /^https?:/i.test(u);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isWeb(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (isWeb(url)) { e.preventDefault(); shell.openExternal(url); }
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
