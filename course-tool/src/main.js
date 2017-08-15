/**
 * Created by WolfTungsten on 2017/8/9.
 */
const {app, BrowserWindow, Menu} = require('electron');
const path = require('path');
const url = require('url');
const pkg = require('../package.json');
const xlsx = require('xlsx');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

const ipc = require('electron').ipcMain;
const dialog = require('electron').dialog;
const fs = require('fs');







var renderMsgSender;
var course;

let gradeList=new Object();
let nameList=new Object();
let lowControl=new Object();

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({width: 635,
        height: 480,
        resizable:false,
        maximizable:false,
        useContentSize:true});

    // and load the index.html of the app.
    if(pkg.dev){
        win.loadURL("http://localhost:3000/");

    }else{
        win.loadURL(url.format({
            pathname: path.join(__dirname, '../build/index.html'),
            protocol: 'file:',
            slashes: true
        }))
    }

    // Open the DevTools.
    //win.webContents.openDevTools();

    // Emitted when the window is closed.
    win.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        win = null
    });
    Menu.setApplicationMenu(null);
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
                //log(filePath);
                event.sender.send('course-list', courseFromFile);
                course=courseFromFile;
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
    });
    //生成成绩单模板
    ipc.on('spawn-template',(e,a)=>{
        spawnTemplate();
    });
    ipc.on('load-grade-data',(e,a)=>{
        analyze();
        log('[+]开始分析！');
    });
    ipc.on('export-result',(e,a)=>{
        exportResult();
    });


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

//生成模板
function spawnTemplate(){
    dialog.showSaveDialog({title:'生成成绩单模板文件',
            filter:[{
                name:'成绩单模板',
                extensions:['xlsx']
            }],
            defaultPath:'成绩单模板.xlsx'},
        (filename)=>{
            if(filename) {
                let subjects=['语文','理科数学','文科数学','英语','物理','化学','生物',
                '政治','历史','地理'];
                let WorkBook = {
                    SheetNames : [],
                    Sheets : {}
                };
                for(let i in subjects){
                    WorkBook.SheetNames.push(subjects[i]);
                    WorkBook.Sheets[subjects[i]]=xlsx.utils.aoa_to_sheet(
                        [['考号','姓名','班级',subjects[i]]]
                    );
                }
                xlsx.writeFile(WorkBook,filename);
                let options = {
                    type: 'info',
                    title: '成绩单模板生成成功',
                    message: "成绩单模板生成成功，保存于"+filename,
                    buttons: ['好的!']
                };
                dialog.showMessageBox(options, function (index) {
                });
            }
        })
}
//核心排课
function analyze() {

    let successCounter = 0;
    let Counter = 0;
    let path ='';

    dialog.showOpenDialog({title:'选择成绩单文件',
        properties:['openFile'],
        filters: [
            {name: '成绩单文件', extensions: ['xlsx']}
        ]
    },(filePath)=>{
        log('[+]对话框选择文件路径'+filePath);
        if(filePath) {
            setTimeout(()=>{analyzeCore(filePath)},500);
        }
    });

function analyzeCore(path) {
    log('[+]选择成绩单文件路径'+path);
    let workbook = xlsx.readFile(path.toString());
    for(let subjectIndex in workbook.SheetNames){
        let sheetName = workbook.SheetNames[subjectIndex];
        let sheet = workbook.Sheets[sheetName];

        let row = 2;
        while(true) {
            if (!sheet['A' + row]) {
                break;
            }
            //log(name2subject(sheetName));
            if(!gradeList[name2subject(sheetName)])
            {
                gradeList[name2subject(sheetName)]=[];
            }
            let number = sheet['A' + row].v;
            let name = sheet['B' + row].v;
            let classID = sheet['C' + row].v;
            let grade = parseInt(sheet['D' + row].v);
            gradeList[name2subject(sheetName)].push({
                number: sheet['A' + row].v,
                name: sheet['B' + row].v,
                classID: sheet['C' + row].v,
                grade: parseInt(sheet['D' + row].v)
            });
            if(!nameList['$'+number]){
                nameList['$'+number]={
                    name:name,
                    classID:classID,
                    course:[],
                    time:[],
                    select:[]
                }
            }
            nameList['$' + number].course.push({
                subject:name2subject(sheetName),
                grade:grade
            });
            row++;
        }
        gradeList[name2subject(sheetName)].sort((a, b)=>{
            return b.grade - a.grade;
        });

    }
    //log(gradeList);
    log('[+]成绩单加载完毕');
    //成绩单加载完毕

    //确定各科目、各层级分数段
    for(let subject in course){
        //遍历所有科目
        let rank = 1;
        let highGrade = gradeList[subject][0].grade;
        let lowGrade = 0;
        let subjectAmount = 0;
        while(true){
            if(!course[subject]['rank_'+rank]){
                break;
            }
            //遍历所有等级
            let amount = 0;
            for(let index in course[subject]['rank_'+rank]){
                //遍历该等级所有课程计算总人数
                amount += course[subject]['rank_'+rank][index].amount;
            }
            subjectAmount += amount;
            log('[+]科目' + subject + '等级' + rank + '共有' + amount);
            lowGrade = gradeList[subject][(subjectAmount>=gradeList[subject].length)?gradeList[subject].length-1:subjectAmount-1].grade;
            for (let i in course[subject]['rank_'+rank]) {
                course[subject]['rank_' + rank][i].highGrade = highGrade;
                course[subject]['rank_' + rank][i].lowGrade = lowGrade;
            }
            log('设置科目' + subject + '等级' + rank + ' 成绩高阈值：' + highGrade + ' 成绩低阈值：' + lowGrade);
            highGrade = lowGrade;
            rank++;

        }
        lowControl[subject] = lowGrade;
        if(subjectAmount<gradeList[subject].length){
            dialog.showErrorBox('设置有误', '选择 '+name2subject(subject)+' 的人数多于课程设置人数');
            return;
        }
    }

    for (let number in nameList)
    {
        let tempTime=[];
        let tempSubject={};
        let currentSubject = '';
        Counter++;
        setCounter(Counter);
        for (let attemp=0;attemp<600;attemp++)//尝试阈值
        {
            //判断是否选课成功
            let subjectCounter = 0;
            for(let i in nameList[number].course){
                if(tempSubject.hasOwnProperty(nameList[number].course[i].subject))
                {
                    subjectCounter++;
                }
            }
            if(subjectCounter>=nameList[number].course.length)
            {
                //TODO：选课成功写入course和nameList
                for(let i in tempSubject){
                    let rank = tempSubject[i].rank;
                    let subject = tempSubject[i].subject;
                    let courseName = tempSubject[i].name;
                    for(let j in course[subject][rank])
                    {
                        if(course[subject][rank][j].name === courseName)
                        {
                            course[subject][rank][j].count++;
                            if(!course[subject][rank][j].hasOwnProperty('list'))
                            {
                                course[subject][rank][j].list = [];
                            }
                            course[subject][rank][j].list.push({
                                number:number
                            });
                        }

                    }
                    nameList[number].select.push({
                        name:courseName
                    });
                }
                successCounter++;
                setSuccessCounter(successCounter);
                break;//跳出尝试循环
            }
            //~判断是否选课成功

            let toSelect = nameList[number].course.filter((item)=>{
                if(item.subject in tempSubject)
                {
                    return false;
                }
                else
                    return true;
            });
            toSelect.sort((a,b)=>{
                return getCourse(a.subject,a.grade,tempTime).length - getCourse(b.subject,b.grade,tempTime).length;
            });

            currentSubject = toSelect[0].subject;
            let available = getCourse(currentSubject,toSelect[0].grade,tempTime);
            if(available.length>0){
                //有可用课程
                let select = available[attemp<6?0:Math.floor(Math.random() * available.length)];
                tempSubject[currentSubject]={
                    rank:select.rank,
                    name:select.course.name,
                    subject:currentSubject
                };
                for(let index in select.course.time)
                {
                    tempTime.push(select.course.time[index]);
                }
            }
            else{
                //本轮尝试失败
                log('[-] 在'+nameList[number].name+' 安排：'+currentSubject+' 时矛盾');
                log('安排情况如下');
                for (let subject in tempSubject)
                {
                    log(tempSubject[subject].name);
                }
                tempTime = [];
                tempSubject = {};

            }

        }
    }
    let options = {
        type: 'info',
        title: '排课成功',
        message: "排课完成，现在可以导出排课结果了",
        buttons: ['好的！']
    };
    dialog.showMessageBox(options, function (index) {
    });
}

}
//导出xlsx
function exportResult() {
    let path='';
    dialog.showSaveDialog({title:'导出排课结果',
            filter:[{
                name:'排课结果',
                extensions:['xlsx']
            }],
            defaultPath:'排课结果.xlsx'},
        (filename)=>{
            if(filename) {
                path = filename;
                //导出到Excel
                let exportWorkBook = {
                    SheetNames : [],
                    Sheets : {}
                };
                let sheetName = '';
                let data = [];
//生成按照学号排序的表格
                sheetName = '花名册';
                data.push(['班级','姓名','已选课程']);
                for(let number in nameList){
                    let temp = [nameList[number].classID,nameList[number].name];
                    for(let i in  nameList[number].select)
                    {
                        temp.push(nameList[number].select[i].name);
                    }
                    data.push(temp.slice(0));
                }
                exportWorkBook.SheetNames.push(sheetName);
                exportWorkBook.Sheets[sheetName] = xlsx.utils.aoa_to_sheet(data);

//生成按课程排列的表格
                for(let subject in course){
                    for(let rank in course[subject])
                    {
                        for(let courseIndex in course[subject][rank])
                        {
                            sheetName = course[subject][rank][courseIndex].name;
                            data = [['姓名','班级','成绩'],[course[subject][rank][courseIndex].name,'分数上界',course[subject][rank][courseIndex].highGrade]];
                            for(let studentIndex in course[subject][rank][courseIndex].list)
                            {
                                let number = course[subject][rank][courseIndex].list[studentIndex].number;
                                let temp = [];
                                temp.push([
                                    nameList[number].name,
                                    nameList[number].classID,
                                    nameList[number].course.filter((a)=>{
                                        if(a.subject == subject){
                                            return true;
                                        }
                                    })[0].grade
                                ]);
                                temp.sort((a,b)=>{
                                    return b[2] - a[2];
                                });
                                data = data.concat(temp);
                            }
                            data.push([course[subject][rank][courseIndex].name,'分数下界',course[subject][rank][courseIndex].lowGrade]);
                            data.push(['设定人数',course[subject][rank][courseIndex].amount,'实际人数',course[subject][rank][courseIndex].count]);
                            exportWorkBook.SheetNames.push(sheetName);
                            exportWorkBook.Sheets[sheetName] = xlsx.utils.aoa_to_sheet(data);
                        }
                    }
                }
                xlsx.writeFile(exportWorkBook,path.toString());

            }
        });
    if(path == '')
    {
        return;
    }

}



//utils functions
//从中文名称转换到英文名称
function name2subject(name){
    switch (name){
        case '语文':
            return "chinese";
        case '理科数学':
            return "scienceMath";
        case '文科数学':
            return "artMath";
        case '英语':
            return "english";
        case '物理':
            return "physics";
        case '化学':
            return "chemistry";
        case '生物':
            return "biology";
        case '政治':
            return "philosophy";
        case '思想品德':
            return "philosophy";
        case '地理':
            return "geography";
        case '历史':
            return "history";
        case 'chinese':
            return "语文";
        case 'scienceMath':
            return "理科数学";
        case 'artMath':
            return "文科数学";
        case 'english':
            return "英语";
        case 'physics':
            return "物理";
        case 'chemistry':
            return "化学";
        case 'biology':
            return "生物";
        case 'philosophy':
            return "思想品德";
        case 'geography':
            return "地理";
        case 'history':
            return "历史";
        default:
            return undefined;
    }
}
//检查时间可用性
function checkTime(time,timeList){
    for(let i in timeList){
        for(let j in time) {
            if (timeList[i].weekday === time[j].weekday) {
                if (timeList[i].start <= time[j].start + time[j].duration - 1 && time[j].start + time[j].duration - 1 <= timeList[i].start + timeList[i].duration - 1)
                    return false;
                if (timeList[i].start <= time[j].start && time[j].start <= timeList[i].start + timeList[i].duration - 1)
                    return false;
                if (time[j].start <= timeList[i].start && time[j].start + time[j].duration - 1 >= timeList[i].start + timeList[i].duration - 1)
                    return false;
            }
        }
    }
    return true;
}
//获取可用科目列表
function getCourse(subject, grade, timeList){
    let result=[];
    for(let rank in course[subject]){
        if(course[subject][rank][0].highGrade>=grade && grade>=course[subject][rank][0].lowGrade)
        {
            for(let i in course[subject][rank])
            {
                if(checkTime(course[subject][rank][i].time,timeList))
                {
                    if(!course[subject][rank][i].hasOwnProperty('count'))
                    {
                        course[subject][rank][i].count = 0;
                        //log('[-]人数未定义，初始化为:' + course[subject][rank][i].count);
                    }
                    if(course[subject][rank][i].count <= course[subject][rank][i].amount*1.3)
                    {
                        result.push({rank:rank,course:course[subject][rank][i]});
                    }
                    else{
                        log(course[subject][rank][i].name+'[-]由于人数冲突失败'+'当前人数：'+course[subject][rank][i].count);
                    }
                }
                else{
                    //log('[-]由于时间冲突失败');
                }
            }
            break;
        }
        else{
            // log('[-]由于成绩不符合要求失败,科目'+subject+',高：'+course[subject][rank][0].highGrade+'，当前：'+grade+'，低：'+course[subject][rank][0].lowGrade)
        }
    }
    result.sort((a,b)=>{
        return a.course.count - b.course.count;
    });
    return result;
}
function setCounter(number) {
    if(renderMsgSender)
    {
        renderMsgSender.send('set-counter',number);
    }
}
function setSuccessCounter(number) {
    if(renderMsgSender)
    {
        renderMsgSender.send('set-success-counter',number);
    }
}