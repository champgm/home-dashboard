<template>
  <v-app>
    <div id="nav">
      <!-- <router-link to="/">Favorites</router-link>|
      <router-link to="/lights">Lights</router-link>|
      <router-link to="/plugs">Plugs</router-link>|
      <router-link to="/groups">Groups</router-link>-->
      <v-btn class="v-router-btn" color="info" to="/">Favorites</v-btn>|
      <v-btn class="v-router-btn" color="info" to="/lights">Lights</v-btn>|
      <v-btn class="v-router-btn" color="info" to="/plugs">Plugs</v-btn>|
      <v-btn class="v-router-btn" color="info" to="/groups">Groups</v-btn>
    </div>
    <router-view/>
  </v-app>
</template>

<style lang="scss">
* {
  text-transform: none !important;
}
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    // color: #2c3e50;
    // &.router-link-exact-active {
    //   color: #42b983;
    // }
  }
}
.v-router-btn.v-btn--active.v-btn.v-btn--router.theme--light.info {
  background-color: #ffc107 !important;
  border-color: #ffc107 !important;
}
// .v-router-btn v-btn  {
//   background-color: #ffc107 !important;
//   border-color: #ffc107 !important;
// }
.v-btn--active:before,
.v-btn:focus:before,
.v-btn:hover:before {
  background-color: #ffc107 !important;
  border-color: #ffc107 !important;
}
</style>
