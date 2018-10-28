<template>
  <div class="home">
    <Dashboard msg="Welcome to Your Vue.js + TypeScript App"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Dashboard from "@/components/Dashboard.vue"; // @ is an alias to /src
import { Mutators } from "@/store";
import { ILight } from "node-hue-api";

@Component({
  components: {
    Dashboard
  }
})
export default class Home extends Vue {
  mounted() {
    this.$store.dispatch(Mutators.refreshLights);
    this.$store.dispatch(Mutators.refreshPlugs);
  }
}
</script>
