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
//从工作薄加载成绩
log('[+]正在加载成绩单');
let workbook = xlsx.readFile(path.join(__dirname, '../高一期中数据2.xlsx'));
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
for (let number in nameList)
{
    log('[+] '+nameList[number].name+'开始排课');
    for (let attemp=0; attemp<20;attemp++){//每个学生尝试10次
        let successCount=0;//成功排课的数量
        let success = false;
        for(let subjectIndex in nameList[number].course)
        {
            nameList[number].course.sort((a,b)=>{
                return getCourse(a.subject,a.grade,nameList[number].time).length - getCourse(b.subject,b.grade,nameList[number].time).length;
            });
            let subject = nameList[number].course[subjectIndex].subject;
            let rank = '';
            let available = getCourse(subject,
                nameList[number].course[subjectIndex].grade,
                nameList[number].time
            );
            if(available.length>0){
                let select = available[Math.floor(Math.random()*available.length)]; //随机选出一门可用的课程
                rank = select.rank;
                nameList[number].time.push(select.course.time);//增加个人时间占用
                nameList[number].select.push({
                    name:select.course.name,
                    rank:rank,
                    subject:subject}
                    );//临时记录已选课程
                successCount++;
                log('[+] '+nameList[number].name+' 安排了：'+select.course.name);
            }
            else{
                if(nameList[number].course[subjectIndex].grade<=lowControl[subject]){
                    successCount++;
                    log('[-]警告 '+nameList[number].name+' 的：'+subject+' 低于分数区间');
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
            log('[+] '+nameList[number].name+' 了安排：'+successCount+' 选课数量：'+nameList[number].course.length);
            if(successCount >= nameList[number].course.length)
            {
                log('[+] '+nameList[number].name+' 选课成功');
                //进入此处表示该学生排课成功
                for (let i in nameList[number].select){
                    for(let j in course[nameList[number].select[i].subject][nameList[number].select[i].rank])
                    {
                        if(course[nameList[number].select[i].subject][nameList[number].select[i].rank][j].name ===
                                nameList[number].select[i].name)
                        {
                            course[nameList[number].select[i].subject][nameList[number].select[i].rank][j].count++; //增加该课程已选人数
                            if(!course[nameList[number].select[i].subject][nameList[number].select[i].rank][j].list){
                                course[nameList[number].select[i].subject][nameList[number].select[i].rank][j].list =[];
                            }
                            course[nameList[number].select[i].subject][nameList[number].select[i].rank][j].list.push({
                                number:number,
                                name:nameList[number].name
                            });//在该课程已选名单中增加该学生信息
                        }
                    }
                }
                success = true;
                break;
            }
        }
        if(success){
            break;
            log('[+]' + nameList[number].name + '已安排' + nameList[number].select);
        }
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
        case '思想品德':
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
        if(timeList[i].weekday === time.weekday){
            if(timeList[i].start <= time.start+time.duration-1 &&time.start+time.duration-1 <= timeList[i].start+timeList[i].duration-1)
                return false;
            if(timeList[i].start <= time.start && time.start <= timeList[i].start+timeList[i].duration-1)
                return false;
            if(time.start <= timeList[i].start && time.start+time.duration-1 >=timeList[i].start+timeList[i].duration-1)
                return false;
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

//log(checkTime(new time(1,3,3),[]));

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
                        log('[-]人数未定义，初始化为:' + course[subject][rank][i].count);
                    }
                    if(course[subject][rank][i].count < course[subject][rank][i].amount*1.3)
                    {
                        result.push({rank:rank,course:course[subject][rank][i]});
                    }
                    else{
                        log('[-]由于人数冲突失败','当前人数：'+course[subject][rank][i].count);
                    }
                }
                else{
                    log('[-]由于时间冲突失败');
                }
            }
            break;
        }
        else{
           // log('[-]由于成绩不符合要求失败,科目'+subject+',高：'+course[subject][rank][0].highGrade+'，当前：'+grade+'，低：'+course[subject][rank][0].lowGrade)
        }
    }
    //result.sort((a,b)=>{
    //    return a.course.count - b.course.count;
    //});
    return result;
}

function log(msg) {
    fs.appendFileSync('log.txt',msg+'\n');
}