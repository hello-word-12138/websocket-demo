<template>
  <div class="chatWp" :style="{'top':pTop+'px','left':pLeft+'px'}">
      <Button class="button animated bounceIn" type="primary" v-show="!isShow" @click="enter">点击进入聊天室</Button>
      <div ref="chatBox" v-show='isShow' class="chatInfoWp animated bounceIn">
        <div class="pull" ref="pull">{{titleInfo}}</div>
        <div class="infoWp">
          <div class="infoMes animated bounceIn" v-for="x in totalInfo" :class="{myself:x.guid==guid}">
            <span class="name" v-show="x.guid!=guid">{{x.name}}</span>
            <span class="cont">{{x.data}}</span>
          </div>
          <div ref="infoWp" class="opa"></div>
        </div>
        <div class="inputWp">
          <Input size="large" v-model="value" placeholder="想说啥就说啥" class="input" @on-enter="send">
            <Button slot="append" icon="paper-airplane" @click="send">发送</Button>
          </Input>
        </div>
        <div class="nameListWp">
          <div class="pull">当前在线人数{{clientLength}}</div>
          <div v-for="xx in clientNames">{{xx.name}}</div>
        </div>
      </div>
  </div>
</template>
<script>
//"ws://localhost:1215/"
import _ from "lodash";
import { getName, getGuid } from "@/util/util";
export default {
  data() {
    return {
      isShow: false,
      value: "", //输入内容
      totalInfo: [], //聊天内容
      clientLength: 0, //在线人数
      clientNames: [], //在线名单
      websocket: {},
      guid: getGuid(),
      name: getName(),
      pTop: 100,
      pLeft: 100,
      titleInfo: "欢迎来到比利聊天室！"
    };
  },
  methods: {
    enter() {
      let self = this;
      self.isShow = true;
      self.$Message.info({
        content: `欢迎来到匿名聊天室，你的名字是 ${self.name} 请尽情吐槽吧！！`,
        duration: 8
      });
      //ws操作
      self.websocket = new WebSocket(`ws://localhost:1215/`);
      console.log("open");
      let tempObj = {
        type: "report",
        data: { name: self.name, guid: self.guid }
      };
      self.websocket.onopen = function() {
        self.websocket.send(JSON.stringify(tempObj));
      };
      self.websocket.onmessage = function(e) {
        if (e.data === "CLOSE!") {
          self.websocket.close();
        }
        let data = JSON.parse(e.data);
        switch (data.type) {
          case "member":
            self.clientLength = data.data.length;
            self.clientNames.length = 0;
            self.clientNames.push(...data.data);
            break;
          case "message":
            self.totalInfo.push(data.data);
            self.$refs.infoWp.scrollIntoView(true);
            break;
          case "systemInfo":
            break;
          case "notice":
            break;
        }
      };
      this.websocket.onerror = err => {
        console.log(err);
      };
      this.websocket.onclose = err => {
        this.$Message.info("退出聊天室");
        this.isShow = false;
      };
      //初始化移动;
      this.initMove();
    },
    //初始化移动
    initMove() {
      let self = this;
      let flag = false; //开关
      let x0 = 0; //鼠标初始位置x
      let y0 = 0; //鼠标初始位置y
      let L = self.pLeft; //记录起点x
      let T = self.pTop; //记录起点y
      let xd = 0; //x的移动距离
      let yd = 0; //y的移动距离
      self.$refs.pull.addEventListener("mousedown", function(ev) {
        x0 = ev.clientX;
        y0 = ev.clientY;
        L = self.pLeft;
        T = self.pTop;
        xd = 0;
        yd = 0;
        flag = true;
      });
      window.addEventListener("mousemove", function(ev) {
        if (flag) {
          xd = ev.clientX - x0;
          yd = ev.clientY - y0;
        }
      });
      window.addEventListener("mouseup", function() {
        flag = false;
      });
      self.$refs.pull.addEventListener("mouseenter", function(e) {
        self.titleInfo = "我可以拖动";
      });
      self.$refs.pull.addEventListener("mouseleave", function(e) {
        self.titleInfo = `你是 ${self.name}`;
      });
      let _active = function() {
        self.pLeft += (L + xd - self.pLeft) / 4;
        self.pTop += (T + yd - self.pTop) / 4;
        window.requestAnimationFrame(_active);
      };
      _active();
    },
    //发送信息
    send: _.debounce(function() {
      this.value = this.value.replace(/^\s+|\s+$/g, "");
      if (this.value == "" || this.value.length >= 120) {
        return;
      } else {
        let guid = this.guid;
        let host = location.hostname || null;
        let data = this.value.toString();
        let name = this.name;
        let obj = { guid, data, name };
        this.websocket.send(JSON.stringify({ type: "message", data: obj }));
        this.value = "";
      }
    }, 100)
  },
  mounted() {
    this.$Notice.warning({
      title: "限制通知",
      desc:
        "由于服务器负载压力，目前限制0.2s延迟发送消息！且不支持发送空格和大于120个字符的内容！目前存在较多bug，会在后续优化，在实现基本的预想功能后开源！",
      duration: 8
    });
  }
};
</script>
<style scoped >
@import url(../assets/animate.css);
.chatWp {
  position: absolute;
  left: 100px;
  top: 100px;
  width: 500px;
  height: 600px;
  font-size: 16px;
}
.button {
  display: block;
  margin: auto;
}
.infoMes {
  margin-bottom: 16px;
  margin-right: 20%;
}
.infoMes .name {
  font-size: 14px;
  color: #999;
  display: block;
}
.infoMes .cont {
  display: inline-block;
  padding: 8px;
  border-radius: 5px;
  background-color: lightblue;
  max-width: 100%;
  word-wrap: break-word;
}
.infoMes.myself {
  margin-right: 0;
  margin-left: 20%;
}
.infoMes.myself .cont {
  float: right;
  text-align: right;
  background-color: bisque;
}
.infoMes::after {
  content: "";
  clear: both;
  display: table;
}
.chatInfoWp,
.nameListWp {
  border-radius: 5px;
  border: 1px solid #ddd;
  height: 100%;
  background-color: #f9f9f9;
}
.chatInfoWp .pull {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 35px;
  line-height: 35px;
  color: #fff;
  border-radius: 5px;
  background-color: lightseagreen;
  text-align: center;
  cursor: move;
  z-index: 10;
}
.nameListWp {
  position: absolute;
  padding: 50px 10px 10px;
  left: calc(100% + 5px);
  top: 0;
  width: 220px;
  overflow-y: auto;
}
.nameListWp .pull {
  background-color: rebeccapurple;
  cursor: auto;
}
.infoWp {
  padding: 50px 10px;
  height: 93%;
  overflow-y: auto;
  overflow-x: hidden;
}
.opa {
  height: 50px;
}
.inputWp {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
}
.ivu-message {
  font-size: 14px;
}
</style>
