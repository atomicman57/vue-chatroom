<template>
  <b-row>
    <b-col cols="12">
      <h2>
        Room List
        <b-link href="#/add-room">(Add Room)</b-link>
        <b-link @click="logout()">(Logout)</b-link>
      </h2>
      <b-table striped hover :items="rooms" :fields="fields">
        <template slot="actions" scope="row">
          <b-btn size="sm" @click.stop="join(row.item._id)">Join</b-btn>
        </template>
      </b-table>
      <ul v-if="errors && errors.length">
        <li v-for="error of errors">
          {{error.message}}
        </li>
      </ul>
    </b-col>
  </b-row>
</template>

<script>

import axios from 'axios'

export default {
  name: 'RoomList',
  data () {
    return {
      fields: {
        room_name: { label: 'Room Name', sortable: true, 'class': 'text-center' },
        type: { label: 'Type', sortable: true, 'class': 'text-center' },
        'creator.nickname': {
          label: 'Created By', sortable: true, 'class': 'text-center'
        },
        actions: { label: 'Action', 'class': 'text-center' }
      },
      rooms: [],
      errors: [],
      user: {}
    }
  },
  created () {
    axios.defaults.headers.common['Authorization'] = localStorage.getItem('jwtToken')
    localStorage.removeItem('roomToken')
    axios.get(`http://localhost:3000/api/room`)
    .then(response => {
      this.rooms = response.data
    })
    .catch(e => {
      this.errors.push(e)
      if(e.response.status === 401) {
        this.$router.push({
          name: 'Login'
        })
      }
    })
  },
  methods: {
    join (id) {
      this.$router.push({
        name: 'JoinRoom',
        params: { id: id }
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
