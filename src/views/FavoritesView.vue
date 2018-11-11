<template>
  <div class="home">
    <Favorites msg="Welcome to Your Vue.js + TypeScript App"/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Favorites from '@/components/Favorites.vue'; // @ is an alias to /src
import { Mutate } from '@/store';
import { ILight } from 'node-hue-api';

@Component({
  components: {
    Favorites,
  },
})
export default class FavoritesView extends Vue {
  public async mounted() {
    const refreshLightsPromise = this.$store.dispatch(Mutate.refreshLights);
    const refreshPlugsPromise = this.$store.dispatch(Mutate.refreshPlugs);
    const refreshGroupsPromise = this.$store.dispatch(Mutate.refreshGroups);
    const refreshFavoritesPromise = this.$store.dispatch(Mutate.refreshFavorites);
    await refreshLightsPromise;
    await refreshPlugsPromise;
    await refreshGroupsPromise;
    await refreshFavoritesPromise;
  }
}
</script>
