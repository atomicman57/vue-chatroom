<template>
<div>
    <b-row v-if="this.banned == false && this.loading == false">
      <b-col cols="4">
            <user-list></user-list>
        </b-col>
      <b-col cols="8">
        <h2>
          Chat Room - <b-btn size="sm" @click.stop="leaveRoom()">Leave Room</b-btn>
          <b-link @click="logout()">(Logout)</b-link>
        </h2>
        <b-col>
          <b-list-group class="panel-body" v-chat-scroll>
            <b-list-group-item v-for="(item, index) in chats" class="chat">
              <div class="left clearfix" v-if="(item.type == 'Public' && item.sender._id == user._id) || (item.type =='Private' && item.sender._id == user._id)">
                <b-img left src="http://placehold.it/50/55C1E7/fff&text=ME" rounded="circle" width="75" height="75" alt="img" class="m-1" />
                <div class="chat-body clearfix">
                  <div class="header">
                    <strong class="primary-font">{{ item.sender.nickname }}</strong> <small class="pull-right text-muted">
                    <strong class="primary-font" v-if="item.type == 'Private'">(Private)</strong> <small class="pull-right text-muted">
                    <span class="glyphicon glyphicon-time"></span>{{ item.created_date }}</small>
                  </div>
                  <p v-html="item.message">{{ item.message }}</p>
                </div>
              </div>
              <div class="right clearfix" v-else-if="(item.type == 'Public') || (item.type =='Private' && item.recipient._id == user._id)">
              <div class="right clearfix">
                <b-img right v-bind:src="`http://placehold.it/50/55C1E7/fff&text=${item.sender.nickname[0]}`" rounded="circle" width="75" height="75" alt="img" class="m-1" />
                <div class="chat-body clearfix">
                  <div class="header">
                    <strong class="primary-font">{{ item.sender.nickname }}</strong> <small class="pull-right text-muted">
                    <strong class="primary-font" v-if="item.type == 'Private'">(Private)</strong> <small class="pull-right text-muted">

                    <span class="glyphicon glyphicon-time"></span>{{ item.created_date }}</small>
                  </div>
                  <p v-html="item.message">{{ item.message }}</p>
                </div>
              </div>
            </b-list-group-item>
          </b-list-group>
        </b-col>
        <ul v-if="errors && errors.length">
          <li v-for="error of errors">
            {{error.message}}
          </li>
        </ul>
            <!-- <link-prevue url="https://vuejs.org/"></link-prevue> -->

        <b-form @submit="onSubmit" class="chat-form">
          <b-input-group prepend="">
            <wysiwyg id="message" v-model="chat.message" />
            <b-form-select id="type" required v-model="chat.type" :options="options" class="mb-3" />
            <b-form-select v-if="chat.type=='Private'" id="type" required v-model="chat.recipient" class="mb-3">
              <template slot="first">
              <option :value="null" disabled>-- Please select a user --</option>
            </template>
                <option v-for="(item, index) in users" :value="item.userId">{{item.nickname}}</option>
            </b-form-select>


            <!-- <b-form-input id="message" :state="state" v-model.trim="chat.message"></b-form-input> -->
            <b-input-group-append>
              <b-btn type="submit" variant="info">Send</b-btn>
            </b-input-group-append>
          </b-input-group>
        </b-form>
      </b-col>
    </b-row>
    <div v-else-if="banned">
      <h2>
          Chat Room - 
        <b-link href="#/">(Room List)</b-link>
        <b-link @click="logout()">(Logout)</b-link>
        </h2>
       <b-alert show variant="danger">You are banned from this room</b-alert>
    </div>
  </div>
</template>

<script>
import Vue from "vue";
import axios from "axios";
import * as io from "socket.io-client";
import VueChatScroll from "vue-chat-scroll";
import LinkPrevue from "link-prevue";
import UserList from "@/components/UserList";

Vue.use(VueChatScroll);

export default {
  name: "ChatRoom",
  components: {
    LinkPrevue,
    UserList
  },
  data() {
    return {
      chats: [],
      errors: [],
      user: {},
      banned: false,
      nickname: "",
      chat: {
        type: "Public"
      },
      loading: true,
      room: {},
      users: [],
      socket: io("http://localhost:4000"),
      options: [
        { value: "Public", text: "General" },
        { value: "Private", text: "Private" }
      ]
    };
  },
  created() {
    axios.defaults.headers.common["Authorization"] = localStorage.getItem(
      "jwtToken"
    );
    const user = JSON.parse(localStorage.getItem("user"));
    this.user = user;
    this.chat.nickname = this.user.nickname;
    this.nickname = this.user.nickname;
    this.checkRoom();
  },
  watch: {
    loading: function(value) {
      if (value == false) {
        if (!this.banned) {
          this.socket.emit("join-room", {
            room: this.$route.params.id,
            user: this.user
          });
          this.socket.emit("get-user", { room: this.$route.params.id });
          axios
            .get(`http://localhost:3000/api/chat/` + this.$route.params.id)
            .then(response => {
              this.chats = response.data;
            })
            .catch(e => {
              this.errors.push(e);
            });

          this.socket.on(
            "new-message",
            function(data) {
              if (data.message.room === this.$route.params.id) {
                this.chats.push(data.message);
              }
            }.bind(this)
          );

          this.socket.on(
            this.$route.params.id,
            function(data) {
              this.users = data.message;
              this.users = this.users.filter(
                user => user.userId != this.user._id
              );
            }.bind(this)
          );

          this.socket.on(
            "user-kick-out",
            function(data) {
              data = data.message;
              if (
                data.room == this.$route.params.id &&
                data.user.userId == this.user._id
              ) {
                this.chat.room = this.$route.params.id;
                this.chat.message =
                  this.user.nickname + " was kicked out of this room";
                axios
                  .post(`http://localhost:3000/api/chat`, this.chat)
                  .then(response => {
                    this.socket.emit("save-message", {
                      room: this.chat.room,
                      nickname: this.user.nickname,
                      message: "was kicked out of this room",
                      created_date: new Date()
                    });
                    this.$router.push({
                      name: "RoomList"
                    });
                  })
                  .catch(e => {
                    this.errors.push(e);
                  });
                this.socket.emit("get-user", { room: this.$route.params.id });
                localStorage.removeItem("roomToken");
                this.$router.push({
                  name: "RoomList"
                });
              }
            }.bind(this)
          );

           this.socket.on(
            "ban-room-user",
            function(data) {
              data = data.message;
              if (
                data.room == this.$route.params.id &&
                data.user.userId == this.user._id
              ) {
                this.chat.room = this.$route.params.id;
                this.chat.message =
                  this.user.nickname + " was banned from this room";
                axios
                  .post(`http://localhost:3000/api/chat`, this.chat)
                  .then(response => {
                    this.socket.emit("save-message", {
                      room: this.chat.room,
                      nickname: this.user.nickname,
                      message: "was banned from this room",
                      created_date: new Date()
                    });
                    this.banned = true;
                  })
                  .catch(e => {
                    this.errors.push(e);
                  });
                this.socket.emit("get-user", { room: this.$route.params.id });
                localStorage.removeItem("roomToken");
                this.$router.push({
                  name: "RoomList"
                });
              }
            }.bind(this)
          );
        }
      }
    }
  },
  methods: {
    leaveRoom() {
      this.socket.emit("save-message", {
        room: this.chat.room,
        nickname: this.chat.nickname,
        message: this.chat.nickname + " left this room",
        created_date: new Date()
      });
      this.socket.emit("leave-room", {
        room: this.$route.params.id,
        nickname: this.chat.nickname,
        message: this.chat.nickname + " left this room",
        created_date: new Date()
      });
      this.socket.emit("get-user", { room: this.$route.params.id });
      localStorage.removeItem("roomToken");
      this.chat.room = this.$route.params.id;
      this.chat.message = this.user.nickname + " left this room";
      axios
        .post(`http://localhost:3000/api/chat`, this.chat)
        .then(response => {
          this.socket.emit("save-message", {
            room: this.chat.room,
            nickname: this.user.nickname,
            message: "left this room",
            created_date: new Date()
          });
          this.$router.push({
            name: "RoomList"
          });
        })
        .catch(e => {
          this.errors.push(e);
        });
    },
    onSubmit(evt) {
      evt.preventDefault();
      this.chat.room = this.$route.params.id;
      axios
        .post(`http://localhost:3000/api/chat`, this.chat)
        .then(response => {
          this.socket.emit("save-message", response.data);
          this.chat.message = "";
        })
        .catch(e => {
          this.errors.push(e);
        });
    },
    logout () {
      localStorage.removeItem('jwtToken')
      this.$router.push({
        name: 'Login'
      })
    },
    checkRoom() {
      axios
        .get(`http://localhost:3000/api/room/` + this.$route.params.id)
        .then(response => {
          this.room = response.data;
          const room = response.data;
          if (room.banned_users.length > 0) {
            if (room.banned_users.includes(this.user._id)) {
              this.banned = true;
              return;
            }
          }
          this.loading = false;
          if (this.room.type == "Private") {
            axios.defaults.headers.common["roomToken"] = localStorage.getItem(
              "roomToken"
            );
            axios
              .post(`http://localhost:3000/api/room/verify`)
              .then(response => {
                if (response.data._id != this.$route.params.id) {
                  this.$router.push({
                    name: "RoomList"
                  });
                }
              })
              .catch(e => {
                this.$router.push({
                  name: "RoomList"
                });
                this.errors.push(e);
              });
          }
        })
        .catch(e => {
          this.errors.push(e);
        });
    }
  }
};
</script>

<style>
.chat .left .chat-body {
  text-align: left;
  margin-left: 100px;
}

.chat .right .chat-body {
  text-align: right;
  margin-right: 100px;
}

.chat .chat-body p {
  margin: 0;
  color: #777777;
}

.panel-body {
  overflow-y: scroll;
  height: 350px;
  /* width: 20%; */
}

.chat-form {
  margin: 20px 14px;
  width: 80%;
}
#type {
  width: 18%;
  margin: 0px 8px;
}
</style>
