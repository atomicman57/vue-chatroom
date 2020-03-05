import Vue from "vue";
import Router from "vue-router";
import RoomList from "@/components/RoomList";
import AddRoom from "@/components/AddRoom";
import JoinRoom from "@/components/JoinRoom";
import ChatRoom from "@/components/ChatRoom";
import Login from "@/components/Login";
import Register from "@/components/Register";
import axios from "axios";

Vue.use(Router);
let router = new Router({
  routes: [
    {
      path: "/",
      name: "RoomList",
      component: RoomList,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/login",
      name: "Login",
      component: Login
    },
    {
      path: "/register",
      name: "Register",
      component: Register
    },
    {
      path: "/add-room",
      name: "AddRoom",
      component: AddRoom,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/join-room/:id",
      name: "JoinRoom",
      component: JoinRoom,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: "/chat-room/:id",
      name: "ChatRoom",
      component: ChatRoom,
      meta: {
        requiresAuth: true
      }
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (localStorage.getItem("jwtToken") == null) {
      next({
        path: "/login",
        params: { nextUrl: to.fullPath }
      });
    } else {
      axios.defaults.headers.common["Authorization"] = localStorage.getItem(
        "jwtToken"
      );
      axios
        .get(`http://localhost:3000/api/auth/currentuser`)
        .then(response => {
          const user = response.data;
          localStorage.setItem("user", JSON.stringify(user))
          next();
        })
        .catch(e => {
          // this.errors.push(e);
          // if (e.response.status === 401) {
            next({
              path: "/login",
              params: { nextUrl: to.fullPath }
            });
          // }
        });
      // let user = JSON.parse(localStorage.getItem('user'))
      // if(to.matched.some(record => record.meta.is_admin)) {
      //   if(user.is_admin == 1){
      //       next()
      //   }
      //   else{
      //       next({ name: 'userboard'})
      //   }
      // }
      // else {
      // 	next()
      // }
    }
  } else {
    next()
  }
  // else if(to.matched.some(record => record.meta.guest)) {
  //     if(localStorage.getItem('jwtToken') == null){
  //         next()
  //     }
  //     else{
  //         next({ name: 'userboard'})
  //     }
  //   }else {
  //   next()
  // }
});

export default router;
