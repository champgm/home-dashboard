<template>
  <div class="home">
    <Lights/>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Lights from '@/components/Lights.vue'; // @ is an alias to /src
import { Mutate } from '@/store';
import { ILight } from 'node-hue-api';

@Component({
  components: {
    Lights,
  },
})
export default class LightsView extends Vue {
  public async mounted() {
    await this.$store.dispatch(Mutate.refreshLights);
  }
}
</script>
