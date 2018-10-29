<template>
  <div class="home">
    <Favorites msg="Welcome to Your Vue.js + TypeScript App"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import Favorites from "@/components/Favorites.vue"; // @ is an alias to /src
import { Mutators } from "@/store";
import { ILight } from "node-hue-api";

@Component({
  components: {
    Favorites
  }
})
export default class FavoritesView extends Vue {
  public mounted() {
    this.$store.dispatch(Mutators.refreshLights);
    this.$store.dispatch(Mutators.refreshPlugs);
    this.$store.dispatch(Mutators.refreshFavorites);
  }
}
</script>
