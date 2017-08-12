/**
 * Created by WolfTungsten on 2017/8/9.
 */
const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const pkg = require('../package.json')
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const fs = require('fs');


var renderMsgSender;
var course;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 640,
        height: 480,
        //resizable:false,
        maximizable:false,
        useContentSize:true});

    // and load the index.html of the app.
    if(pkg.dev){
        win.loadURL("http://localhost:3000/");
        win.webContents.openDevTools();
    }else{
        win.loadURL(url.format({
            pathname: path.join(__dirname, '../build/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }

    // Open the DevTools.


    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    });
}

function main(){
    createWindow();
    ipc.on('render_sign_in',function (event,args) {
        renderMsgSender = event.sender;
    });
    //渲染进程更新主进程课程表
    ipc.on('set-course-list',function (event,args) {
        course = args;
        log('更新课程表');
        log(JSON.stringify(course));
    });
    //从文件获取课程表
    ipc.on('get-course-list',function(event,args){
        let path = '.';
        dialog.showOpenDialog({title:'选择课表文件',
            properties:['openFile'],
            filters: [
            {name: '课表文件', extensions: ['course']}
        ]
        },(filePath)=>{
            if(filePath) {
                let courseFromFile = JSON.parse(fs.readFileSync(filePath.toString()));
                log(filePath);
                event.sender.send('course-list', courseFromFile);
            }
        })
    });
    //将课程表写入到文件
    ipc.on('write-course-list-to-file',function (event,args) {
        dialog.showSaveDialog({title:'保存课表文件',
        filter:[{
            name:'课程表文件',
            extensions:['course']
        }],
            defaultPath:'课程安排.course'},
            (filename)=>{
            if(filename) {
                fs.writeFileSync(filename, JSON.stringify(course));
            }
            })
    })


}

function log(msg){
    if(renderMsgSender){
        renderMsgSender.send('log',msg);
    }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', main);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
