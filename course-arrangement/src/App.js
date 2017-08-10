import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const ipc = window.require('electron').ipcRenderer;

class App extends Component {
    constructor(props){
        super(props);
        this.state={
            isArrange:false,
            isTime:false,
            course:{
                chinese:{
                    rank_1:[{
                        name:'语文A1',
                        time:[{
                            weekday:6,
                            start:1,
                            duration:1
                        }],
                        amount:50,
                        teacher:'刘凤仙',
                        classroom:'507'
                    }],
                    rank_2:[],
                    rank_3:[],
                },
                scienceMath:{
                    rank_1:[{
                        name:'数学A1',
                        time:[{
                            weekday:6,
                            start:2,
                            duration:3
                        }],
                        amount:50,
                        teacher:'高文亮',
                        classroom:'507'
                    }],
                    rank_2:[],
                },
                artMath:{
                    rank_1:[],
                    rank_2:[],
                },
                english:{
                    1:[],
                    2:[],
                },
                physics:{
                    1:[],
                    2:[],
                },
                chemistry:{
                    1:[],
                    2:[],
                },
                biology:{
                    1:[],
                    2:[],
                },
                philosophy:{
                    1:[],
                    2:[],
                },
                geography:{
                    1:[],
                    2:[]
                },
                history:{
                    1:[],
                    2:[]
                },

            },
            courseTemplate:{
               subject:'',
                time:[]
            },
            timeTemplate:{
                weekday:6,
                start:1,
                duration:1
            }
        };
        this.subjects=[
            {name:'语文',
            value:'chinese'},
            {name:'理科数学',
                value:'scienceMath'},
            {name:'文科数学',
                value:'artMath'},
            {name:'英语',
                value:'english'},
            {name:'物理',
                value:'physics'},
            {name:'化学',
                value:'chemistry'},
            {name:'生物',
                value:'biology'},
            {name:'思想品德',
                value:'philosophy'},
            {name:'历史',
                value:'history'},
            {name:'地理',
                value:'geography'}
        ];
        this.weekdays=[
            {name:'一',value:1},
            {name:'二',value:2},
            {name:'三',value:3},
            {name:'四',value:4},
            {name:'五',value:5},
            {name:'六',value:6},
            {name:'日',value:0},
        ];
        this.settingButtonHandle = this.settingButtonHandle.bind(this);
        this.arrangeButtonHandle = this.arrangeButtonHandle.bind(this);
        this.subjectHandle = this.subjectHandle.bind(this);
        this.rankHandle = this.rankHandle.bind(this);
        this.nameHandle = this.nameHandle.bind(this);
        this.amountHandle =this.amountHandle.bind(this);
        this.teacherHandle = this.teacherHandle.bind(this);
        this.classroomHandle = this.classroomHandle.bind(this);
        this.timeButtonHandle = this.timeButtonHandle.bind(this);
        this.weekdayHandle = this.weekdayHandle.bind(this);
        this.startHandle = this.startHandle.bind(this);
        this.durationHandle = this.durationHandle.bind(this);
        this.addHandle = this.addHandle.bind(this);
        this.addCourseHandle = this.addCourseHandle.bind(this);

        ipc.on('log',function (event,msg) {
            console.log('[MainProcess]-'+msg);
        });
        ipc.send('render_sign_in','log');

    }

    settingButtonHandle(){
        this.setState({isArrange:false});
    }
    arrangeButtonHandle(){
        this.setState({isArrange:true});
    }
    timeButtonHandle(){
        this.setState({isTime:!this.state.isTime});
    }

    //临时科目的内容
    subjectHandle(subject){
        let template = this.state.courseTemplate;
        template.subject = subject;
        this.setState({courseTemplate:template});
    }
    rankHandle(rank){
        let template = this.state.courseTemplate;
        template.rank = parseInt(rank);
        this.setState({courseTemplate:template});

    }
    nameHandle(name){
        let template = this.state.courseTemplate;
        template.name = name;
        this.setState({courseTemplate:template});
    }
    amountHandle(amount){
        let template = this.state.courseTemplate;
        template.amount = parseInt(amount);
        this.setState({courseTemplate:template});

    }
    teacherHandle(teacher){
        let template = this.state.courseTemplate;
        template.teacher = teacher;
        this.setState({courseTemplate:template});

    }
    classroomHandle(classroom){
        let template = this.state.courseTemplate;
        template.classroom = classroom;
        this.setState({courseTemplate:template});
    }

    //临时时间点的内容
    weekdayHandle(weekday){
        let temp = this.state.timeTemplate;
        temp['weekday'] = parseInt(weekday);
        this.setState({timeTemplate:temp});

    }
    startHandle(start){
        let temp = this.state.timeTemplate;
        temp['start'] = parseInt(start);
        this.setState({timeTemplate:temp});

    }
    durationHandle(duration){
        let temp = this.state.timeTemplate;
        temp['duration'] = parseInt(duration);
        this.setState({timeTemplate:temp});

    }
    addHandle(){
        let temp = this.state.courseTemplate;
        if(this.state.timeTemplate.duration>0 && this.state.timeTemplate.start>0) {
            temp.time.push({
                weekday:this.state.timeTemplate.weekday,
                start:this.state.timeTemplate.start,
                duration:this.state.timeTemplate.duration
            });
            this.setState({courseTemplate:temp});
        }
        else{
            alert('请设置正确的时间！');
        }

    }
    addCourseHandle(){
        let newCourse = this.state.courseTemplate;
        let temp={
            name:newCourse.name,
            time:newCourse.time,
            amount:newCourse.amount,
            teacher:newCourse.teacher,
            classroom:newCourse.classroom
        };
        let course = this.state.course;
        if ("rank_"+newCourse.rank in course[newCourse.subject]){
            course[newCourse.subject]["rank_"+newCourse.rank].push(temp);
        }
        else{
            course[newCourse.subject]["rank_"+newCourse.rank]=[temp];
        }
        this.setState({course:course});
    }

  render() {
        let that = this;
      //显示当前时间设置
      let timeSetting =<div>
          <div>
              <span>每周</span>
              <DropdownList list={this.weekdays} databind={this.weekdayHandle}></DropdownList>
              <span>第</span>
              <Textbox databind={this.startHandle}/>
              <span>节开始，上</span>
              <Textbox databind={this.durationHandle}/>
              <span>节课</span>
              <button onClick={this.addHandle}>添加</button>
          </div>
          <div>
              {this.state.courseTemplate.time.map(function (item) {
                  let weekday;
                  for(let i in that.weekdays){

                      if (that.weekdays[i].value == item.weekday)
                      {
                          weekday = that.weekdays[i].name;

                      }
                  }

                  return <div>每周{weekday}-第{item.start}节开始-上{item.duration}节课</div>
              })}
          </div>
      </div>;
      let courseList=[];
      for(let subject in this.state.course)
      {
          for(let rank in this.state.course[subject])
          {
              for (let i in this.state.course[subject][rank])
              {
                  let course = this.state.course[subject][rank][i];
                  let weekday;
                  for(let j in that.weekdays){
                      if (that.weekdays[j].value === course.time[0].weekday)
                      {
                          weekday = that.weekdays[j].name;
                      }
                  }
                  let item = <div>
                      <span>每周{weekday} </span>
                      <span>{course.name} </span>
                      <span>{course.teacher} 老师 </span>
                      <span>{course.classroom} 教室 </span>
                  </div>
                  courseList.push(item);
              }
          }
      }
      let settingFace=<div id="setting-face">
        <div>
            <div>
                <p>科目</p>
                <DropdownList list={this.subjects} databind={this.subjectHandle}></DropdownList>
                <p>级别</p>
                <Textbox databind={this.rankHandle}></Textbox>
                <p>名称</p>
                <Textbox databind={this.nameHandle}></Textbox>
                <button onClick={this.timeButtonHandle} className="button">时间段</button>

            </div>
            {this.state.isTime?timeSetting:<div/>}
            <div>
                <p>教师</p>
                <Textbox databind={this.teacherHandle}></Textbox>
                <p>教室</p>
                <Textbox databind={this.classroomHandle}></Textbox>
                <p>人数</p>
                <Textbox databind={this.amountHandle}></Textbox>
                <button onClick={this.addCourseHandle} className="main-button">添加课程</button>
            </div>
            <div>
                <span>当前课表</span>
                <span>导出文件</span>
                <span>从文件加载</span>
            </div>
            <div>
                {courseList}
            </div>
        </div>

      </div>;

      let arrangeFace=<div id="arrange-face">

      </div>;

    return (
      <div className="App">
        <div id="topbar">
            <button id="setting-button" onClick={this.settingButtonHandle}>课程安排</button>
            <button id="arrange-button" onClick={this.arrangeButtonHandle}>排课！</button>
        </div>
          {this.state.isArrange?arrangeFace:settingFace}

      </div>
    );
  }
}

class Textbox extends Component{
    constructor(props){
        super(props);
        this.state={
            value:''
        };
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){
        this.setState({value:event.target.value});
        this.props.databind(event.target.value);
    }

    render(){
        return <input id={this.props.id} className={this.props.className} style={this.props.style} type="text" onChange={this.handleChange} onFocus={this.handleChange} onBlur={this.handleChange}/>
    }

}

class DropdownList extends Component{
    constructor(props){
        super(props);
        this.state={
            value:'',
            list:this.props.list
        };
        this.props.databind(this.props.list[0].value);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){
        this.props.databind(event.target.value);
    }

    render(){
        let elements=this.props.list.map(function (item) {
            return <option value={item.value}>{item.name}</option>
        });
        return <select onChange={this.handleChange}>
            {elements}
        </select>
    }

}
export default App;
