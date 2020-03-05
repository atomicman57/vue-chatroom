<template>
  <b-row v-if="room.type=='Private'">
    <b-col align-self="start">&nbsp;</b-col>
    <b-col cols="6" align-self="center">
      <h2>
        Join Room
        <b-link href="#/">(Room List)</b-link>
        <b-link @click="logout()">(Logout)</b-link>
      </h2>
      <div v-if="errors && errors.length">
        <div v-for="error of errors">
          <b-alert show>{{error.message}}</b-alert>
        </div>
      </div>
      <b-form @submit="onSubmit">
        <b-form-group id="fieldsetHorizontal"
                  horizontal
                  :label-cols="4"
                  breakpoint="md"
                  label="Password">
          <b-form-input type="password" id="password" required :state="state" v-model.trim="chat.password"></b-form-input>
        </b-form-group>
        <b-button type="submit" variant="primary">Join</b-button>
      </b-form>
    </b-col>
    <b-col align-self="end">&nbsp;</b-col>
  </b-row>
</template>

<script>
import axios from "axios";
import * as io from "socket.io-client";

export default {
  name: "JoinRoom",
  data() {
    return {
      chat: {},
      socket: io("http://localhost:4000"),
      room: {},
      user: {},
      errors: []
    };
  },
  created() {
    axios.defaults.headers.common["Authorization"] = localStorage.getItem(
      "jwtToken"
    );

    const user = JSON.parse(localStorage.getItem("user"));
    this.user = user;
    this.chat.nickname = this.user.nickname;
    axios
      .get(`http://localhost:3000/api/room/` + this.$route.params.id)
      .then(response => {
        this.room = response.data;
        if (this.room.type !== "Private") {
          return this.joinRoom();
        }
      })
      .catch(e => {
        this.errors.push(e);
      });
  },
  methods: {
    onSubmit(evt) {
      evt.preventDefault();
      axios
        .post(`http://localhost:3000/api/room/private`, {
          id: this.$route.params.id,
          password: this.chat.password
        })
        .then(response => {
          this.room_token = response.data.token;
          localStorage.setItem("roomToken", response.data.token);
          axios.defaults.headers.common["roomToken"] = localStorage.getItem(
            "roomToken"
          );
          return this.joinRoom();
        })
        .catch(e => {
          this.errors.push(e.response.data);
        });
    },
    joinRoom() {
      this.chat.room = this.$route.params.id;
      this.chat.message = this.user.nickname + " join the room";
      return axios
        .post(`http://localhost:3000/api/chat`, this.chat)
        .then(response => {
          this.socket.emit("save-message", {
            room: this.chat.room,
            nickname: this.user.nickname,
            message: "Join this room",
            created_date: new Date()
          });

          this.$router
            .push({
              path: `/chat-room/${this.$route.params.id}`
            })
            .bind(this);
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
    }
  }
};
</script>
