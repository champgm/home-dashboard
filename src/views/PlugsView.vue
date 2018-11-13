<template>
  <div class="home">
    <Plugs/>
  </div>
</template>

<script lang='ts'>
import { Component, Vue } from 'vue-property-decorator';
import Plugs from '@/components/Plugs.vue'; // @ is an alias to /src
import { Mutate } from '@/store';
import { ILight } from 'node-hue-api';

@Component({
  components: {
    Plugs,
  },
})
export default class PlugsView extends Vue {
  public async mounted() {
    this.$store.dispatch(Mutate.refreshPlugs);
  }
}
</script>
