<template>
  <b-row>
    <b-col align-self="start">&nbsp;</b-col>
    <b-col cols="6" align-self="center">
      <h2>
        Add Room
        <b-link href="#/">(Room List)</b-link>
        <b-link @click="logout()">(Logout)</b-link>
      </h2>
      <b-form @submit="onSubmit">
        <b-form-group id="fieldsetHorizontal"
                  horizontal
                  :label-cols="4"
                  breakpoint="md"
                  label="Enter Room Name">
          <b-form-input id="room_name" required :state="state" v-model.trim="room.room_name"></b-form-input>
        </b-form-group>
        <b-form-group id="fieldsetHorizontal"
                  horizontal
                  :label-cols="4"
                  breakpoint="md"
                  label="Type">
          <b-form-select id="room-type" required v-model="room.type" :options="options" class="mb-3" />
        </b-form-group>
         <b-form-group id="fieldsetHorizontal"
                  horizontal
                  :label-cols="4"
                  breakpoint="md"
                  label="Password"
                  v-if="room.type=='Private'"
                  >
          <b-form-input required type="password" id="password" :state="state" v-model.trim="room.password"></b-form-input>
        </b-form-group>
        <b-button type="submit" variant="primary">Add</b-button>
      </b-form>
    </b-col>
    <b-col align-self="end">&nbsp;</b-col>
  </b-row>
</template>

<script>

import axios from 'axios'

export default {
  name: 'AddRoom',
  data () {
    return {
      room: {},
      options: [
        { value: null, text: 'Please select an option', disabled: true },
        { value: 'Public', text: 'Public' },
        { value: 'Private', text: 'Private' },
      ],
      errors: []
    }
  },
  methods: {
    onSubmit (evt) {
      evt.preventDefault()
      axios.defaults.headers.common['Authorization'] = localStorage.getItem('jwtToken')
      axios.post(`http://localhost:3000/api/room`, this.room)
      .then(response => {
        this.$router.push({
          name: 'RoomList'
        })
      })
      .catch(e => {
        this.errors.push(e)
      })
    },
    logout () {
      localStorage.removeItem('jwtToken')
      this.$router.push({
        name: 'Login'
      })
    }
  }
}
</script>
