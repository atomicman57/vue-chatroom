<template>
<div>
    <h2>
        Users
    </h2>
   <b-list-group v-if="users.length > 0" class="user-panel-body" v-chat-scroll>
        <b-list-group-item v-for="(item, index) in users" class="chat">
          <div class="left clearfix">
            <b-img right v-bind:src="`http://placehold.it/50/55C1E7/fff&text=${item.nickname[0]}`" rounded="circle" width="75" height="75" alt="img" class="m-1" />
            <div class="chat-body clearfix">
              <div class="header">
                <strong class="primary-font">{{ item.nickname }}</strong> <small class="pull-right text-muted">
                <!-- <span class="glyphicon glyphicon-time"></span>{{ item.created_date }}</small> -->
              </div>
              <div class="actions" v-if="room.creator._id == user._id"> 
                <b-input-group-append>
                    <b-btn @click.stop="kickUserOut(item)" variant="info">Kick Out</b-btn>
                    <b-btn @click.stop="banUser(item)" variant="info">Ban User</b-btn>
                </b-input-group-append>
              </div>
              <!-- <p v-html="item.message">{{ item.message }}</p> -->
            </div>
          </div>
        </b-list-group-item>
      </b-list-group>
      <div v-else>
          <h4>No other user in the room </h4>
      </div>
      </div>
</template>

<script>

import Vue from 'vue'
import axios from 'axios'
import * as io from 'socket.io-client'
// import VueChatScroll from 'vue-chat-scroll'
// import LinkPrevue from 'link-prevue'

// Vue.use(VueChatScroll)

export default {
  name: 'user-list',
  data () {
    return {
      errors: [],
      users: [],
      chat: {},
      chats: [],
      room: {},
      user: {},
      socket: io('http://localhost:4000')
    }
  },
  created () {
    axios.defaults.headers.common['Authorization'] = localStorage.getItem('jwtToken')
    const user = JSON.parse(localStorage.getItem('user'));
    this.user = user;
    this.chat.nickname = this.user.nickname;
    this.nickname = this.user.nickname;
    this.socket.emit("get-user", {room: this.$route.params.id});
    this.checkRoom()
      this.socket.on(this.$route.params.id, function (data) {
        this.users = data.message
        this.users = this.users.filter(user => user.userId != this.user._id);
      }.bind(this))
  },
  methods: {
    kickUserOut(user){
        this.socket.emit('kick-user-out', {room: this.$route.params.id,user})
    },
    banUser(user) {
      const roomId = this.$route.params.id;
      axios.post(`http://localhost:3000/api/room/ban`, { id: roomId, userId: user.userId })
      .then(response => {
        this.socket.emit('ban-user', { room: roomId, user})
      })
      .catch(e => {
        this.errors.push(e)
      })
    },
    checkRoom() {
      axios
      .get(`http://localhost:3000/api/room/` + this.$route.params.id)
      .then(response => {
        this.room = response.data;
        if (this.room.type == "Private") {
            axios.defaults.headers.common['roomToken'] = localStorage.getItem('roomToken')
            axios.post(`http://localhost:3000/api/room/verify`)
            .then(response => {
                if(response.data._id != this.$route.params.id){
                  this.$router.push({
                    name: 'RoomList'
                  })
                }
            })
            .catch(e => {
              this.$router.push({
                    name: 'RoomList'
              })
              this.errors.push(e)
            })
        }
      })
      .catch(e => {
        this.errors.push(e);
        
      });
    }
  }
}
</script>

<style>

  .user-panel-body {
    overflow-y: scroll;
    height: 350px;
  }

  .actions {
      margin-top: 5%;
  }

</style>
