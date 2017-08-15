/**
 * Created by WolfTungsten on 2017/8/13.
 */
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

log('xlsx模块已加载');
let course = JSON.parse(fs.readFileSync(path.join(__dirname, '../final2.course')));
let gradeList=new Object();
let nameList=new Object();
let lowControl=new Object();
let successCounter = 0;
let Counter = 0;

//从工作薄加载成绩
log('[+]正在加载成绩单');
let workbook = xlsx.readFile(path.join(__dirname, '../高一期中数据删除.xlsx'));
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
//log(nameList);
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
        log('科目' + subject + '等级' + rank + '共有' + amount);
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
}
log(course);

/*
for (let number in nameList)
{
    Counter++;
    log('[+] '+nameList[number].name+'开始排课');
    for (let attemp=0; attemp<=20;attemp++){//每个学生尝试10次
        let successCount=0;//成功排课的数量
        let success = false;
        nameList[number].course.sort((a,b)=>{
            return getCourse(a.subject,a.grade,nameList[number].time).length - getCourse(b.subject,b.grade,nameList[number].time).length;
        for(let subjectIndex in nameList[number].course)
        {
            let subject = nameList[number].course[subjectIndex].subject;
            if(nameList[number].course[subjectIndex].grade>=lowControl[subject]) {
                let rank = '';
                let available = getCourse(subject,
                    nameList[number].course[subjectIndex].grade,
                    nameList[number].time.slice(0)
                );
                if (available.length > 0) {
                    let select = available[attemp < 1 ? 0 : Math.floor(Math.random() * available.length)]; //随机选出一门可用的课程
                    rank = select.rank;
                    for (let timeIndex in select.course.time) {
                        nameList[number].time.push({
                            start: select.course.time[timeIndex].start,
                            weekday: select.course.time[timeIndex].weekday,
                            duration: select.course.time[timeIndex].duration
                        });//增加个人时间占用
                    }
                    nameList[number].select.push({
                            name: select.course.name,
                            rank: rank,
                            subject: subject
                        }
                    );//临时记录已选课程
                    successCount++;
                    log('[+] ' + nameList[number].name + ' 安排了：' + select.course.name);
                    //log('占用时间 开始时间：' + nameList[number].time[timeIndex].start + '持续时间： ' + nameList[number].time[timeIndex].duration + '星期：'+nameList[number].time[timeIndex].duration);
                    for (let timeIndex in nameList[number].time) {
                        //log('占用时间 开始时间：' + nameList[number].time[timeIndex].start + '持续时间： ' + nameList[number].time[timeIndex].duration + '星期：'+nameList[number].time[timeIndex].weekday);
                    }
                }
                else {
                    if (nameList[number].course[subjectIndex].grade <= lowControl[subject]) {
                        successCount++;
                        log('[-]警告 ' + nameList[number].name + ' 的：' + subject + ' 低于分数区间');
                        break;
                    }
                    else {
                        successCount = 0;
                        log('[-] ' + nameList[number].name + ' 由于：' + subject + ' 选课失败');
                        for (let k in nameList[number].select) {
                            log(nameList[number].select[k].subject + ':' + nameList[number].select[k].grade);
                        }
                        nameList[number].time = [];
                        nameList[number].select = [];
                        continue;
                    }

                }

                log('[+] ' + nameList[number].name + ' 了安排：' + successCount + ' 选课数量：' + nameList[number].course.length);
            }

            if(attemp>=20){
                log('[-]'+nameList[number].name+'无法排课');
            }
        }
        if(success){
            break;
            log('[+]' + nameList[number].name + '已安排' + nameList[number].select);
        }
    }
}
*///不完善算法

for (let number in nameList)
{
    let tempTime=[];
    let tempSubject={};
    let currentSubject = '';
    Counter++;
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


xlsx.writeFile(exportWorkBook,'export.xlsx');
log('[+]共计排课 '+Counter+' 人，成功 '+successCounter+' 人');

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
        case '地理':
            return "geography";
        case '历史':
            return "history";
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


class time extends Object
{
    constructor(weekday,start,duration)
    {
        super();
        this.weekday = weekday;
        this.start = start;
        this.duration = duration;
    }
}

console.log(checkTime(new time(6,4,1),[new time(6,5,1),new time(6,6,1),new time(6,1,1),new time(6,4,1)]));

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



function log(msg) {
    fs.appendFileSync('log.txt',msg+'\n');
}